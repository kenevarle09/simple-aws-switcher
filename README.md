# Simple AWS Switcher

Used for switching AWS profiles easily

## Installation

Run
```bash
npm i
```

## Usage
Add your profiles to `.config/profiles.json`
Make sure that the things you add here replicates the information that you have in your `~/.aws/config` file

Example:

AWS config File:
```
[profile profile_name_1]
sso_start_url = https://organization.awsapps.com/start#/
sso_region = us-east-1
sso_account_id = 1234567890
sso_role_name = AdministratorAccess
region = us-east-1
output = json
```
Note: If you don't have profiles configure in your aws config file, you can run `aws configure sso` once to generate a profile.

Proceed adding profiles to `.config/profiles.json` like below:

```json
[
  {
    "ORGANIZATION_NAME": {
      "start_url": "https://organization.awsapps.com/start#/",
      "profiles": ["profile_name_1"]
    }
  }
]
```

Inside `init.sh` change line 3 and 5 to reflect the path to `simple-aws-switcher` folder
Inside `index.js` modify the `sas_path` variable to reflect the path to `simple-aws-switcher` folder

Run `alias sas='. PATH/TO/simple-aws-switcher/init.sh'`

Finally to execute, run `sas`
