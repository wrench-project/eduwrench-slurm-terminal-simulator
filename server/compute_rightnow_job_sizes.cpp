#include <iostream>
#include <vector>
#include <boost/program_options.hpp>

namespace po = boost::program_options;

auto in = [](const auto &min, const auto &max, char const * const opt_name){
    return [opt_name, min, max](const auto &v){
        if(v < min || v > max){
            throw po::validation_error
                    (po::validation_error::invalid_option_value,
                     opt_name, std::to_string(v));
        }
    };
};

/**
 * Returns true if counters are reached the max
 *
 */
bool vectorIncrement(std::vector<int> &counters, std::vector<int> &lb, std::vector<int> &up, std::vector<int> &inc) {

    for (int i=counters.size() - 1; i >= 0; i--) {
        counters.at(i) = counters.at(i) + inc.at(i);
        if (counters.at(i) > up.at(i)) {
            if (i == 0) {
                return true; // done
            }
            counters.at(i) = lb.at(i);
        }  else {
            break;
        }
    }
    return false;
}

void computeJobSizes(int num_cluster_nodes, int num_sizes, int space_to_leave) {
    std::vector<int> lb, ub, inc; // lower bound, upper bound, increment
    std::vector<int> candidates;

    int num_found = 0;
    int last_seen_value = -1;

    // Set up lb
    lb.push_back(2);
    for (int i=1; i < num_sizes; i++) {
        lb.push_back(1);
    }

    // Set up up
    for (int i=0; i < num_sizes; i++) {
        if (i < 2) {
            //ub.push_back(num_cluster_nodes/4);
            ub.push_back(num_cluster_nodes);
        } else if (i < 4) {
            //ub.push_back(num_cluster_nodes/2);
            ub.push_back(num_cluster_nodes);
        } else {
            ub.push_back(num_cluster_nodes);
        }
    }

    // Set up inc
    for (int i=0; i < num_sizes; i++) {
        //inc.push_back(1 + i % 2);
        inc.push_back(1);
    }

    // Initialize candidate
    for (int i=0; i < num_sizes; i++) {
        candidates.push_back(lb.at(i));
    }

    // Two helper vectors
    std::vector<int> zeros;
    std::vector<int> ones;
    std::vector<int> maxes;
    for (int i=0; i < num_sizes; i++) {
        zeros.push_back(0);
        ones.push_back(1);
        maxes.push_back(num_cluster_nodes);
    }

//    std::cerr << "LOWER BOUNDS: ";
//    for (auto const s : lb) {
//        std::cerr << s << " ";
//    }
//    std::cerr << "\n";
//    std::cerr << "UPPER BOUNDS: ";
//    for (auto const s : ub) {
//        std::cerr << s << " ";
//    }
//    std::cerr << "\n";

    // Do it
    while (true) {
          if (candidates.at(0) != last_seen_value) {
              last_seen_value = candidates.at(0);
              std::cerr << "progress: " << last_seen_value << "/" << num_cluster_nodes << "\n";
          }

//        std::cerr << "CANDIDATE: ";
//        for (auto const s : candidates) {
//                std::cerr << s << " ";
//        }
//        std::cerr << "\n";

        // If minimum is > half capacity, nevermind (that would mean only one job at a time!) 
        if (*(std::min_element(candidates.begin(), candidates.end())) < num_cluster_nodes / 3) {

            // Check that space is always left
            std::vector<int> num_jobs;
            num_jobs.reserve(num_sizes);
            for (int i=0; i < num_sizes; i++) {
                num_jobs.push_back(0);
            }
            bool enough_space_left = true;
            while(true) {
//                std::cerr << "   NUM JOBS: ";
//                for (auto const s : num_jobs) {
//                        std::cerr << s << " ";
//                }
//                std::cerr << "  ";
                int occupied_space = 0;
                for (int i=0; i < num_sizes; i++) {
                    occupied_space += num_jobs.at(i) * candidates.at(i);
                }
//                std::cerr << "occupied space: " << occupied_space << "\n";
                if (occupied_space <= num_cluster_nodes) {
                    if (occupied_space > num_cluster_nodes - space_to_leave) {
                        enough_space_left = false;
                        break;
                    }
                }
                if (vectorIncrement(num_jobs, zeros, maxes, ones)) {
                    break;
                }
            }

            // If enough space is left, we found an option
            if (enough_space_left) {
                // Sanity check it
                bool all_unique = true;
                for (int i=0; i < candidates.size(); i++) {
                    for (int j=i+1; j < candidates.size(); j++) {
                        if (candidates.at(i) == candidates.at(j)) {
                            all_unique = false;
                            break;
                        }
                    }
                }
                if (all_unique) {
                    std::cout << "FOUND ONE: ";
                    for (auto const s : candidates) {
                        std::cout << s << ", ";
                    }
                    std::cout << "\n";
                    num_found++;
                }
            }
        }

        // Increment candidate
        if (vectorIncrement(candidates, lb, ub, inc)) {
            break;
        }
    }
    std::cout << "NUM FOUND: " << num_found << "\n";

}

int main(int argc, char **argv) {
    int num_cluster_nodes;
    int num_job_sizes;
    int space_to_leave;

    // Parse command-line arguments
    po::options_description desc("Allowed options (warning, this program is brute-force/high-complexity");
    desc.add_options()
            ("help", "show help message")
            ("nodes", po::value<int>()->notifier(
                    in(1, INT_MAX, "nodes")), "number of compute nodes in the cluster")
            ("numsizes", po::value<int>()->notifier(
                    in(1, INT_MAX, "numsizes")), "number of different sizes needed")
            ("leftover", po::value<int>()->notifier(
                    in(1, INT_MAX, "leftover")), "guaranteed freed nodes")
            ;

    po::variables_map vm;
    try {
        po::store(po::parse_command_line(argc, argv, desc), vm);
        po::notify(vm);
    } catch (std::exception &e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }

    if (vm.count("help")) {
        std::cout << desc << "\n";
        return 1;
    }

    if (!vm.count("nodes") or !vm.count("numsizes") or !vm.count("leftover")) {
        std::cerr << "Missing arguments\n";
        exit(1);
    }

    num_cluster_nodes = vm["nodes"].as<int>();
    num_job_sizes = vm["numsizes"].as<int>();
    space_to_leave = vm["leftover"].as<int>();

    computeJobSizes(num_cluster_nodes, num_job_sizes, space_to_leave);
    std::cout << "\n";
}

