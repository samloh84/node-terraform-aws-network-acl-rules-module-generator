const _ = require('lodash');
const nunjucks_util = require('./nunjucks_util');


let render = function (data) {
    let network_tiers = _.get(data, 'network_tiers');

    let subnet_groups = _.get(network_tiers, 'subnet_groups');
    let cidr_blocks = _.get(network_tiers, 'cidr_blocks');
    let ipv6_cidr_blocks = _.get(network_tiers, 'ipv6_cidr_blocks');
    let ipv6 = _.get(data, 'ipv6');

    let grouped_traffic_rules = _.get(data, 'grouped_traffic_rules');

    let rendered_files = [];

    _.each(grouped_traffic_rules, function (network_acl_rules, network_acl_name) {

        let ingress_rules = _.filter(network_acl_rules, {traffic_rule_type: 'ingress'});
        let egress_rules = _.filter(network_acl_rules, {traffic_rule_type: 'egress'});

        let ingress_rules_accumulated_cidr_blocks = [];
        ingress_rules = _.map(ingress_rules, function (ingress_rule) {
            let rendered_rule = nunjucks_util.network_acl_rule_template.render(_.merge({}, ingress_rule, {accumulated_cidr_blocks: ingress_rules_accumulated_cidr_blocks}));
            switch (ingress_rule.other_network_tier.type) {
                case 'cidr_block':
                    ingress_rules_accumulated_cidr_blocks.push(`local.${ingress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
                case 'ipv6_cidr_block':
                    ingress_rules_accumulated_cidr_blocks.push(`local.${ingress_rule.traffic_rule_name}_ipv6_cidr_blocks`);
                    break;
                case 'subnet_group':
                    ingress_rules_accumulated_cidr_blocks.push(`local.${ingress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
                case 'ipv6_subnet_group':
                    ingress_rules_accumulated_cidr_blocks.push(`local.${ingress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
            }
            return rendered_rule;
        });

        let egress_rules_accumulated_cidr_blocks = [];
        egress_rules = _.map(egress_rules, function (egress_rule) {
            let rendered_rule = nunjucks_util.network_acl_rule_template.render(_.merge({}, egress_rule, {accumulated_cidr_blocks: egress_rules_accumulated_cidr_blocks}));
            switch (egress_rule.other_network_tier.type) {
                case 'cidr_block':
                    egress_rules_accumulated_cidr_blocks.push(`local.${egress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
                case 'ipv6_cidr_block':
                    egress_rules_accumulated_cidr_blocks.push(`local.${egress_rule.traffic_rule_name}_ipv6_cidr_blocks`);
                    break;
                case 'subnet_group':
                    egress_rules_accumulated_cidr_blocks.push(`local.${egress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
                case 'ipv6_subnet_group':
                    egress_rules_accumulated_cidr_blocks.push(`local.${egress_rule.traffic_rule_name}_cidr_blocks`);
                    break;
            }
            return rendered_rule;
        });

        if (_.size(ingress_rules) > 20) {
            console.error(`Warning: network_acl_rules_${network_acl_name}.tf contains potentially more than 20 ingress rules.`)
        }
        if (_.size(egress_rules) > 20) {
            console.error(`Warning: network_acl_rules_${network_acl_name}.tf contains potentially more than 20 egress rules.`)
        }

        let rule_size_comment = `# Number of ingress rule groups: ${_.size(ingress_rules)}\n# Number of egress rule groups: ${_.size(egress_rules)}`;

        let rendered_rules = _.concat([rule_size_comment], ingress_rules, egress_rules);

        rendered_rules = `${rendered_rules.join('\n\n')}`;

        rendered_files.push({
            file_name: `network_acl_rules_${network_acl_name}.tf`,
            file_contents: rendered_rules
        });
    });


    _.each(subnet_groups, function (subnet_group) {
        let subnet_group_name = _.get(subnet_group, 'name');
        let rendered_data_aws_subnet = nunjucks_util.data_subnet_template.render({
            subnet_group_name: subnet_group_name,
            ipv6: ipv6 || _.get(subnet_group, 'ipv6')
        });

        rendered_files.push({
            file_name: `data_subnet_group_${subnet_group_name}.tf`,
            file_contents: rendered_data_aws_subnet
        });
    });


    let variables = [];
    _.each(subnet_groups, function (subnet_group) {
        variables.push(nunjucks_util.variable_template.render({
            network_tier_name: _.get(subnet_group, 'name'),
            subnet_ids: _.get(subnet_group, 'subnet_ids'),
            type: 'subnet_group'
        }));
    });

    _.each(cidr_blocks, function (cidr_block) {
        variables.push(nunjucks_util.variable_template.render({
            network_tier_name: _.get(cidr_block, 'name'),
            cidr_blocks: _.get(cidr_block, 'cidr_blocks'),
            type: 'cidr_block'
        }));
    });

    _.each(ipv6_cidr_blocks, function (ipv6_cidr_block) {
        variables.push(nunjucks_util.variable_template.render({
            network_tier_name: _.get(ipv6_cidr_block, 'name'),
            ipv6_cidr_blocks: _.get(ipv6_cidr_block, 'ipv6_cidr_blocks'),
            type: 'ipv6_cidr_block'
        }));
    });

    variables = _.join(variables, '\n\n');
    rendered_files.push({file_name: `variables.tf`, file_contents: variables});


    return rendered_files;

};

module.exports = {
    render: render
};

