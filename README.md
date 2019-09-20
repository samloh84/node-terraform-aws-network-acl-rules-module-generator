# Node Terraform AWS Network ACL Rules Module Generator

The Node Terraform AWS Network ACL Rules Module Generator is a utility script 
to generate a parameterized Terraform Module containing Network ACL Rules 
from a supplied configuration YAML file.

The generated module is parameterized to accept Network ACL IDs, as well as 
Subnet IDs and CIDR blocks.

## Concept
For the scope of this project, we view the architecture of a system to be a 
[multi-tiered architecture][wikipedia-multitier-architecture].

We generalize the different network entities to belong to a network tier. 
For this project, a Subnet Group is associated with a network tier. Other 
Network ACL targets, such as external IPv4 and IPv6 CIDR blocks are 
represented as network tiers.

A Network ACL rule is an explicit allowing of traffic through a port range 
and a protocol between two network tiers.

The collection of Network ACL rules can be viewed as a 
[directed acyclic graph][wikipedia-directed-acyclic-graph], with the 
network tiers mapped as vertices and the rules mapped as edges of the graph.
For the scope of this project, the DAG is useful  as a data structure.

The configuration file lists the network tiers and traffic rules, along with 
any configurations required for the generation of the Terraform module.

The utility script generates both Network ACL ingress and egress rules 
according to the traffic rules defined in the configuration file.  

## Installation

1. Clone this repository using Git.

    ```bash
    git clone https://github.com/samloh84/node-terraform-aws-network-acl-rules-module-generator
    ```

2. Use NPM to install the dependencies required for this script. 

    ```bash
    npm install
    ```

## Usage

1. Define your network tiers and network traffic rules in the `config.yml` file.

2. Run the following command to generate the Terraform scripts in the `output` directory.
```bash
node index.js
```

## Config Schema

config_schema: 
* network_tiers - network_tiers_schema - Required. Object describing the different network tiers.
* traffic_rules - Array(traffic_rule_schema) - Required. Minimum of 1. Array listing the traffic rules.
* allow_all_to_self - Boolean - Optional. Defaults to true. If true, the script adds rules to allow all traffic for each security group from itself.
* allow_ephemeral - Boolean - Optional. Defaults to true. If true, the script adds rules to allow return traffic through ephemeral ports for each traffic rule. It also adds rules to allow redirection traffic to NAT Gateway Subnet Groups.
* ipv6 - Boolean - Optional. Defaults to false. If true, the script adds additional rules to allow traffic to Subnet Groups with IPV6 CIDR blocks. 

network_tiers_schema:
* subnet_groups - Array(subnet_group_schema) - Required. Minimum of 1. Array listing subnet group network tiers.
* cidr_blocks - Array(cidr_block_schema) - Optional. Array listing CIDR block network tiers
* ipv6_cidr_blocks - Array(ipv6_cidr_block_schema) - Optional. Array listing IPv6 CIDR block network tiers

subnet_group_schema:
* name - String - Required. Name of network tier.
* subnet_ids - String - Optional. If the subnet IDs are known, it can be supplied as a default to the network tier subnet IDs parameter.
* network_acl_id - String - Optional. If the Network ACL ID is known, it can be supplied as a default to the network tier Network ACL ID parameter.
* allow_all_to_self - Boolean - Optional. If allow_all_to_self is disabled globally, this can be set to true to allow all traffic for the security group from itself.
* public - Boolean - Optional. Specifies that the subnet group is public (auto-assigned public IPs) or private.
* nat_gateway - Boolean - Optional. Specifies that the subnet group contains a NAT Gateway used by the other subnet groups.
* ipv6 - Boolean - Optional. If ipv6 is disabled globally, this can be set to true to allow traffic to Subnet Groups with IPV6 CIDR blocks. 


cidr_block_schema:
* name - String - Required. Name of network tier.
* cidr_blocks - Array(String) - Optional. If the CIDR Blocks are known, it can be supplied as a default to the network tier CIDR blocks parameter.


ipv6_cidr_block_schema:
* name - String - Required. Name of network tier.
* ipv6_cidr_blocks - Array(String) - Optional. If the IPV6 CIDR Blocks are known, it can be supplied as a default to the network tier IPV6 CIDR blocks parameter.

traffic_rule_schema:
* port - Integer | port_schema | Array(Integer | port_schema)  - Optional. Describes the port range of the traffic rule. Specify an array to specify multiple port ranges.
* protocol - String - Optional. Describes the traffic protocol of the traffic rule.
* traffic_type - String - Optional. Describes the traffic type of the traffic rule. Known traffic types like https and ssh have standard port ranges and protocols. If specified, overrides specified port and protocol values. If all traffic_type, port and protocol values are unspecified, the traffic rule defaults to allow all traffic. Specify an array to specify multiple traffic types.    
* description - String - Optional. Description of the traffic rule.
* source - String | Array(String) - Required. Source Network Tier Name.  Specify an array to target multiple network tiers. Convenience values like 'all' and 'all_security_groups' target corresponding multiple network tiers. 
* destination - String - | Array(String) - Required. Destination Network Tier Name. Specify an array to target multiple network tiers. Convenience values like 'all' and 'all_security_groups' target corresponding multiple network tiers.

port_schema:
* from - Integer - From port
* to - Integer - To port

## Notes on AWS Security Groups
Do note that AWS imposes limits on the number of security groups and 
network ACLs, as well as the number of ingress and egress rules in each 
security group or network ACL. See the AWS documentation on 
[Amazon VPC Limits][amazon-vpc-limits].

The default limit of ingress rules and egress rules for network ACLs is 20. 
The generated resources may exceed these limits, so modify your configuration 
accordingly.

For network traffic to reach external CIDR ranges:
1. Subnet with NAT Gateway must have Network ACL rule rule to receive traffic 
through outgoing traffic port
2. Subnet with outgoing traffic must have Network ACL rule to receive traffic 
through ephemeral ports 
 

## References
[Terraform AWS Provider Reference - Network ACL Rule][terraform-aws-network-acl-rule]


[wikipedia-multitier-architecture]: https://en.wikipedia.org/wiki/Multitier_architecture
[wikipedia-directed-acyclic-graph]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[amazon-vpc-limits]: https://docs.aws.amazon.com/en_pv/vpc/latest/userguide/amazon-vpc-limits.html
[terraform-aws-network-acl-rule]: https://www.terraform.io/docs/providers/aws/r/network_acl_rule.html
