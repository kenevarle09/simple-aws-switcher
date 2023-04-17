#!/usr/bin/env node

const sas_path = '/home/kdje-prophero/kenevarle/simple-aws-switcher/'
const fs = require('fs');
const inquirer = require('inquirer');
const { exec } = require("child_process");
const { stdout, listenerCount, exit } = require('process');
const homedir = require ('os').homedir()
const inquirerPrompt = require('inquirer-search-list')
const COLOR = {
    reset: '\x1b[0m',
    fgRed: '\x1b[31m',
    fgGreen: '\x1b[32m',
    fgYellow: '\x1b[33m',

    bgYellow: '\x1b[43m'
}

inquirer.registerPrompt("search-list", inquirerPrompt)

//Make config folder
if (!fs.existsSync(sas_path+'.config')){fs.mkdirSync(sas_path+'.config');}

//Make profile.json file

if (!fs.existsSync(sas_path+'.config/profiles.json')) {
    fs.writeFileSync(sas_path+'.config/profiles.json', '[{"default":{"profiles":["default"]}}]')
}

if (!fs.existsSync(sas_path+'.config/selected_profile')) {
    fs.writeFileSync(sas_path+'.config/selected_profile', "default")
}

var getWorkspaces = JSON.parse(fs.readFileSync(sas_path+'.config/profiles.json', 'utf8'));
var workspaces = []


var getAWSConfig = fs.readFileSync(`${homedir}/.aws/config`, 'utf8');
const re_profile_list = /\[(.*?)\][\r\n]+([^\r\n]+)/g;
const re_profile_name = /(?<=\[profile ).+?(?=\])/g;
const match_profile_list = getAWSConfig.match(re_profile_list);

const editor = `${COLOR.fgGreen}Edit${COLOR.reset}`
const exit_prompt = `${COLOR.fgRed}EXIT${COLOR.reset}`
const back_prompt = `${COLOR.fgGreen}Back${COLOR.reset}`
const prefix_prompt = `${COLOR.fgYellow}$${COLOR.reset}`

for (const i in Object.keys(getWorkspaces)) {
    workspaces = workspaces.concat(Object.keys(getWorkspaces[i]))
}


const import_profiles = () => {
    const aws_import_cmd = "aws configure sso";

    var spawn = require('child_process').spawn

    var p = spawn('node',['-i']);

    p.stdout.on('data',function (data) {
        console.log(data.toString())
    });
}

const choose_workspace_prompt = () => {

    inquirer
    .prompt([
    {
        type: 'search-list',
        name: 'workspace',
        loop: 'false',
        prefix: prefix_prompt,
        message: `${COLOR.fgYellow}PLEASE SELECT WORKSPACE TO USE${COLOR.reset}`,
        choices: workspaces.concat([editor, exit_prompt])
    }
    ])
    .then((selected) => {
        selected_workspace = selected.workspace
        workspace_index = workspaces.indexOf(selected_workspace);
        if (selected.workspace === editor) {
            edit_workspace_prompt()
        } 
        else if (selected.workspace === exit_prompt) {
            console.log("\nGoodbye!")
            return;
        }
        else {
            choose_profile_prompt()
        }

    });
}

const choose_profile_prompt = () => {
    
    var profile_list = getWorkspaces[workspace_index][selected_workspace]['profiles']
    profile_message = "CHOOSE A PROFILE"
    if (profile_list !== 'undefined' && profile_list.length === 0) {
        profile_message = "No Profile Available"
        profile_list = ["Add profile"]
    }
    inquirer
        .prompt([
            {
                type: 'search-list',
                name: 'profile',
                prefix: prefix_prompt,
                message: profile_message,
                choices: profile_list.concat([editor, back_prompt])
            }
        ])
        .then((selected) => {
            if (selected.profile === "Add profile"){
                add_profile_prompt()
            }
            else if (selected.profile === back_prompt){
                choose_workspace_prompt()
            }

            else if (selected.profile === editor){
                edit_profile_prompt()
            }
            else {
                selected_profile = selected.profile
                const aws_login_cmd = "aws sso login --profile " + selected_profile;
                const aws_sts_cmd = "aws sts get-caller-identity --profile " + selected_profile;
                const aws_switch_cmd = "export AWS_PROFILE="+selected_profile;
                fs.writeFile(sas_path+".config/selected_profile", selected_profile, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                }); 
                exec(aws_sts_cmd, (error, stdout) => {
                    if (error) {
                        console.log("\nPlease log in to continue\n");
                        const login = exec(aws_login_cmd, (error, stdout) => {
                            if (error) {
                                console.log(`error: ${error.message}`);
                                return;
                            }
                            if (stdout) {
                                console.log(stdout.message)
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
                        login.stdout.on('data', function(data) {
                            console.log(data); 
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
                prefix: prefix_prompt,
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
                name: 'start_url',
                prefix: prefix_prompt,
                message: 'Start URL: '
            }
        ])
        .then((value) => {
            const ws_start_url = value.start_url;
            const new_workspace = value.add_workspace;
            let new_data = {
                [new_workspace]: {
                    "start_url": ws_start_url,
                    "profiles": []
                }
            }
            getWorkspaces.push(new_data)
            fs.writeFile(sas_path+'.config/profiles.json', JSON.stringify(getWorkspaces), function (err) {
                if (err) {
                    console.log(`error: ${err}`);
                }
                if (stdout) {
                    console.log(`${COLOR.fgGreen}Successfully added workspace!${COLOR.reset}`)   
                }
            })
        })

}

const remove_workspace_prompt = () => {
    inquirer
    .prompt([
        {
            type: 'search-list',
            name: 'remove_workspace',
            message: `${COLOR.fgYellow}Select Worksapce to remove${COLOR.reset}`,
            prefix: prefix_prompt,
            choices: workspaces.concat([back_prompt, exit_prompt])
        }
    ])
    .then((selected) => {
        if (selected.remove_workspace === 'default') {
            console.log("\nCannot remove default profile!\n");
            remove_workspace_prompt();
        }
        else if (selected.remove_workspace === back_prompt)
        {
            edit_workspace_prompt();   
        } 
        else if (selected.remove_workspace === exit_prompt) {
            console.log("\nGoodbye!")
            return;
        }
        else {
        remove_workspace_index = workspaces.indexOf(selected.remove_workspace);
        delete getWorkspaces[remove_workspace_index];
        var newWorkspaces = getWorkspaces.filter(function(e) {
            return e != null;
         });
        fs.writeFile(sas_path+'.config/profiles.json', JSON.stringify(newWorkspaces), function (err) {
            if (err) {
                console.log(`error: ${err}`);
            }
            if (stdout) {
                console.log(`${COLOR.fgGreen}Successfully removed workspace!${COLOR.reset}`)   
            }
        })
    }
    })
}

const edit_workspace_prompt = () => {

    inquirer
    .prompt([
    {
        type: 'list',
        name: 'add_remove',
        message: `${COLOR.fgYellow}What would you like to do?${COLOR.reset}`,
        prefix: prefix_prompt,
        choices: ["Add workspace", "Remove workspace", back_prompt]
    }
    ])
    .then((selected) => {
        if (selected.add_remove === 'Add workspace') {
            add_workspace_prompt()
        }
        else if (selected.add_remove === 'Remove workspace') {
            remove_workspace_prompt()
        }
        else if (selected.add_remove === back_prompt){
            choose_workspace_prompt()
        }

    })


}

const edit_profile_prompt = () => {

    inquirer
    .prompt([
    {
        type: 'list',
        name: 'add_remove',
        message: 'What would you like to do?',
        choices: ["Import profile", "Add profile", "Remove profile", back_prompt]
    }
    ])
    .then((selected) => {
        if (selected.add_remove === 'Import profile') {
            import_profiles()
        }
        else if (selected.add_remove === 'Add profile') {
            add_profile_prompt()
        }
        else if (selected.add_remove === 'Remove profile') {
            remove_profile_prompt()
        }
        else if (selected.add_remove === back_prompt) {
            choose_profile_prompt()
        }
        // choose_profile_prompt()
    })

}

const add_profile_prompt = () => {

    var profile_list = getWorkspaces[workspace_index][selected_workspace]['profiles']
    var profile_url = getWorkspaces[workspace_index][selected_workspace]['start-url']

    inquirer
        .prompt([
            {
                type: 'input',
                name: 'add_profile',
                message: 'Name for your profile: ',
                prefix: prefix_prompt
            }
        ])
        .then((value) => {
            const new_profile = value.add_profile;
            let new_data = {
                [selected_workspace]: {
                    "start_url": profile_url,
                    "profiles": profile_list.concat(new_profile)
                }
            }
            remove_workspace_index = workspaces.indexOf(selected_workspace);
            delete getWorkspaces[workspace_index];
            var newProfiles = getWorkspaces.filter(function(e) {
                return e != null;
            });
            newProfiles.push(new_data)
            fs.writeFile(sas_path+'.config/profiles.json', JSON.stringify(newProfiles), function (err) {
                if (err) {
                    console.log(`error: ${err}`);
                }
                if (stdout) {
                    console.log(`${COLOR.fgGreen}Successfully added profile!${COLOR.reset}`)   
                }
            })
        })

}

const cleanObject = (input) => {
    if (typeof input === 'object' && input !== null) {
      if(Array.isArray(input)) {
        return input.map(cleanObject)
                    .filter(item => item !== null && item !== undefined) 
      }
  
      return Object.fromEntries(
        Object.entries(input)
              .map(([key, val]) => [key, cleanObject(val)])
              .filter(([k, v]) => v !== null && v !== undefined)
      );
  
    } 
  
    return input;
  }

const remove_profile_prompt = () => {
    var profile_list = getWorkspaces[workspace_index][selected_workspace]['profiles']

    inquirer
    .prompt([
        {
            type: 'search-list',
            name: 'remove_profile',
            message: `${COLOR.fgYellow}Select Worksapce to remove${COLOR.reset}`,
            prefix: prefix_prompt,
            choices: profile_list.concat([back_prompt, exit_prompt])
        }
    ])
    .then((selected) => {
        if (selected.remove_profile === 'default') {
            console.log("\nCannot remove default profile!\n");
            remove_profile_prompt();
        }
        else if (selected.remove_profile === back_prompt)
        {
            edit_profile_prompt();   
        } 
        else if (selected.remove_profile === exit_prompt) {
            console.log("\nGoodbye!")
            return;
        }
        else {
        remove_profile_index = profile_list.indexOf(selected.remove_profile);
        delete profile_list[remove_profile_index];
        var newProfile = cleanObject(getWorkspaces)
        
        fs.writeFile(sas_path+'.config/profiles.json', JSON.stringify(newProfile), function (err) {
            if (err) {
                console.log(`error: ${err}`);
            }
            if (stdout) {
                console.log(`${COLOR.fgGreen}Successfully removed profile!${COLOR.reset}`)   
            }
        })
    }
    })
}

choose_workspace_prompt()
