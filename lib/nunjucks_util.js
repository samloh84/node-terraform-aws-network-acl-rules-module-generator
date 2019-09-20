const node_path = require('path');
const nunjucks = require('nunjucks');

let templates_path = node_path.resolve(process.cwd(), 'templates');
let env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templates_path));


nunjucks.precompile(templates_path, {env: env});

module.exports = {
    network_acl_rule_template: env.getTemplate('aws_network_acl_rule.tf.jinja2'),
    data_subnet_template: env.getTemplate('data_aws_subnet.tf.jinja2'),
    variable_template: env.getTemplate('variable.tf.jinja2')
};