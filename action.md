
# Download

## Create a folder
```
mkdir actions-runner && cd actions-runner# Download the latest runner package
curl -o actions-runner-linux-x64-2.309.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.309.0/actions-runner-linux-x64-2.309.0.tar.gz

echo "2974243bab2a282349ac833475d241d5273605d3628f0685bd07fb5530f9bb1a  actions-runner-linux-x64-2.309.0.tar.gz" | shasum -a 256 -c

tar xzf ./actions-runner-linux-x64-2.309.0.tar.gz
```

# Configure

## Create the runner and start the configuration experience
```
./config.sh --url https://github.com/hosamelbasiony/sgh_host_hub_alex --token ADY7WINHACPGBGHOOU33S7LFBFXGY

./run.sh
```

# Using your self-hosted runner

## Use this YAML in your workflow file for each job
```
runs-on: self-hosted
```