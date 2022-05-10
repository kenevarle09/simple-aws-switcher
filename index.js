#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const { exec } = require("child_process");
const { stdout } = require('process');

const getWorkspaces = JSON.parse(fs.readFileSync('profiles.json', 'utf8'));
var workspaces = []
var profiles = []

for (const i in Object.keys(getWorkspaces)) {
    workspaces = workspaces.concat(Object.keys(getWorkspaces[i]))
}

workspaces.push("Add New")

for (const i in Object.values(getWorkspaces)) {
    profiles = profiles.concat(Object.values(getWorkspaces[i]))
}

// console.log(workspaces[0], profiles[0]);

inquirer
.prompt([
  {
    type: 'list',
    name: 'workspace',
    message: 'Please select workspace to use',
    choices: workspaces
  }
 ])
.then((selected) => {
    if (selected.workspace === 'Add New') {
        inquirer
        .prompt([
            {
                type: 'input',
                name: 'add_workspace',
                message: 'Name for your workspace: ',
                validate(value) {
                    const pass = value.match(/^[A-Za-z]+$/);
                    if (pass) {
                      return true;
                    }
                    return 'Can only contain letters';
                  }
            },
            {
                type: 'input',
                name: 'add_profile',
                message: 'Name your new profile: ',
                // validate(value) {
                //     const pass = value.match(/^[A-Za-z]+$/);
                //     if (pass) {
                //       return true;
                //     }
                //     return 'Can only contain letters';
                //   }
            }
        ])
        .then((value) => {
            const new_profile = value.add_profile;
            const new_workspace = value.add_workspace;
            let new_data = {
                [new_workspace]: [new_profile]
            }
            getWorkspaces.push(new_data)
            fs.writeFile('profiles.json', JSON.stringify(getWorkspaces), function (err) {
                if (err) {
                    console.log(`error: ${err}`);
                }
                if (stdout) {
                    console.log("Successfully Added")   
                }
            })
        })
    } else {
        let selected_workspace = selected.workspace
        const index = workspaces.indexOf(selected_workspace);
        inquirer
        .prompt([
            {
                type: 'list',
                name: 'profile',
                message: 'Choose a profile',
                choices: profiles[index]
            }
        ])
        .then((selected) => {
            let selected_profile = selected.profile
            const aws_login_cmd = "aws sso login --profile " + selected_profile
            const aws_sts_cmd = "aws sts get-caller-identity --profile " + selected_profile
            exec(aws_sts_cmd, (error, stdout) => {
                if (error) {
                    console.log("Please log in to SSO to continue");
                    exec(aws_login_cmd, (error, stdout) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stdout) {
                            console.log("Login success. Please run the command again")
                        }
                    });
                }
                if (stdout) {
                    console.log("\nSwitch success!\nWorkspace: " + selected_workspace + "\nProfile: " + selected_profile);
                    return;
                }
            });
    
        })
    }

});
