#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const { exec } = require("child_process");
const { stdout, listenerCount } = require('process');

//Make config folder
if (!fs.existsSync('.config')){fs.mkdirSync('.config');}

//Make profile.json file
const default_profile = [{"default": ""}]
if (!fs.existsSync('.config/profiles.json')) {
fs.writeFile('.config/profiles.json', JSON.stringify(default_profile), function(err) {
    if(err) {
        return console.log(err);
    }
});
}

var getWorkspaces = JSON.parse(fs.readFileSync('.config/profiles.json', 'utf8'));
var workspaces = []
var profiles = []

for (const i in Object.keys(getWorkspaces)) {
    workspaces = workspaces.concat(Object.keys(getWorkspaces[i]))
}

for (const i in Object.values(getWorkspaces)) {
    profiles = profiles.concat(Object.values(getWorkspaces[i]))
}

const choose_workspace_prompt = () => {
    inquirer
    .prompt([
    {
        type: 'list',
        name: 'workspace',
        loop: 'false',
        message: 'PLEASE SELECT WORKSPACE TO USE',
        choices: [new inquirer.Separator()].concat(workspaces.concat([new inquirer.Separator(),"Edit", "EXIT"]))
    }
    ])
    .then((selected) => {
        selected_workspace = selected.workspace
        workspace_index = workspaces.indexOf(selected_workspace);
        if (selected.workspace === 'Edit') {
            edit_prompt()
        } 
        else if (selected.workspace === 'EXIT') {
            console.log("\nGoodbye!")
            return;
        }
        else {
            choose_profile_prompt()
        }

    });
}

const choose_profile_prompt = () => {
    var profile_list = profiles[workspace_index]
    profile_message = "CHOOSE A PROFILE"
    if (profiles[workspace_index] === "") {
        profile_message = "No Profile Available"
        profile_list = []
    }
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'profile',
                message: profile_message,
                choices: [new inquirer.Separator()].concat(profile_list).concat([new inquirer.Separator(),'Edit', 'Back', 'EXIT'])
            }
        ])
        .then((selected) => {
            if (selected.profile === 'Back'){
                choose_workspace_prompt()
            }
            else if (selected.profile === 'EXIT'){
                console.log("Goodbye!")
                return;
            } else {
                selected_profile = selected.profile
                const aws_login_cmd = "aws sso login --profile " + selected_profile;
                const aws_sts_cmd = "aws sts get-caller-identity --profile " + selected_profile;
                const aws_switch_cmd = "export AWS_PROFILE="+selected_profile;
                fs.writeFile(".config/selected_profile", selected_profile, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                }); 
                exec(aws_sts_cmd, (error, stdout) => {
                    if (error) {
                        console.log("\nPlease log in to continue");
                        exec(aws_login_cmd, (error, stdout) => {
                            if (error) {
                                console.log(`error: ${error.message}`);
                                return;
                            }
                            if (stdout) {
                                console.log("Login success. Switching profile...");
                                exec(aws_sts_cmd, (error, stdout) => {
                                    if (error) {
                                        console.log(`error: ${error.message}`);
                                        return;
                                    }
                                    if (stdout){
                                        exec(aws_switch_cmd, (error, stdout) => {
                                            if (error) {
                                                console.log(`error: ${error.message}`);
                                                return;
                                            }
                                        })
                                        console.log("\nSwitch success!\nWorkspace: " + selected_workspace + "\nProfile: " + selected_profile);
                                        return;
                                    }
                                })
                            }
                        });
                    }
                    if (stdout) {
                        console.log("\nSwitch success!\nWorkspace: " + selected_workspace + "\nProfile: " + selected_profile);
                        return;
                    }
                });
        }
        })
}
const add_workspace_prompt = () => {
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
            }
        ])
        .then((value) => {
            const new_profile = value.add_profile;
            const new_workspace = value.add_workspace;
            let new_data = {
                [new_workspace]: [new_profile]
            }
            getWorkspaces.push(new_data)
            fs.writeFile('.config/profiles.json', JSON.stringify(getWorkspaces), function (err) {
                if (err) {
                    console.log(`error: ${err}`);
                }
                if (stdout) {
                    console.log("Successfully Added")   
                }
            })
        })
}

const remove_workspace_prompt = () => {
    inquirer
    .prompt([
        {
            type: 'list',
            name: 'remove_workspace',
            message: 'Select Worksapce to remove',
            choices: [new inquirer.Separator()].concat(workspaces.concat([new inquirer.Separator(),"Back", "EXIT"]))
        }
    ])
    .then((selected) => {
        if (selected.remove_workspace === 'default') {
            console.log("\nCannot remove default profile!\n");
            remove_workspace_prompt();
        }
        else if (selected.remove_workspace === 'Back')
        {
            edit_prompt();   
        } 
        else if (selected.remove_workspace === 'EXIT') {
            console.log("\nGoodbye!")
            return;
        }
        else {
        remove_workspace_index = workspaces.indexOf(selected.remove_workspace);
        delete getWorkspaces[remove_workspace_index];
        var newWorkspaces = getWorkspaces.filter(function(e) {
            return e != null;
         });
        fs.writeFile('.config/profiles.json', JSON.stringify(newWorkspaces), function (err) {
            if (err) {
                console.log(`error: ${err}`);
            }
            if (stdout) {
                console.log("Successfully Removed")   
            }
        })
    }
    })
}

const edit_prompt = () => {

    inquirer
    .prompt([
    {
        type: 'list',
        name: 'edit',
        message: 'Which do you like to edit?',
        choices: ["Workspaces","Profiles"]
    },
    {
        type: 'list',
        name: 'add_remove',
        message: 'Please choose an option',
        choices: ["Add", "Remove"]
    }
    ])
    .then((selected) => {
        if (selected.edit === 'Workspaces' && selected.add_remove === 'Add') {
            add_workspace_prompt();
        }
        else if (selected.edit === 'Workspaces' && selected.add_remove === 'Remove') {
            remove_workspace_prompt();
        }
    })
}

choose_workspace_prompt()