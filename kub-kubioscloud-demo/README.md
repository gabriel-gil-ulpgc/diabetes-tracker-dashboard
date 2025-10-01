# KubiosCloud demos

Simple demos for accessing and using KubiosCloud API with user credentials.

## Prerequisites
In order to use this client (Or the APIs in general) you need to have proper
credentials available, you will need:

    - OAuth2 client_id
    - Kubios username and password

## Environment

In order to run the tool, you must have an environment with required Python
libraries installed. The repository contains a Makefile which can build a local
virtual environment containing the required libraries. Run:

```bash
  make venv
  . ./venv/bin/activate
```

before trying the actual tool invocations described later.

If your system (i.e. Windows) doesn't support ``make`` you can install the package and it's dependencies with ``python -m pip install .`` We would recommend using separate virtualenv in that case too.

## Usage examples

Adding ``--debug`` flag to any of the commandlines below will print all the request(s) made and responses got.
### Login

Copy ``sample_config.yaml`` to ``my_config.yaml`` and replace template values with your Kubios username, password and client_id. Get authentication tokens with:

```bash
❯ python -m kubioscloud_demos --config my_config.yaml login --tokens-file tokens.yaml
```

That will write tokens to ``tokens.yaml`` which we will use in other examples. 

### User info

Get information about current user:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml user 
```

### Recording measurement

### Initialization

Each new measurement session needs to be initialized with intended data format and related metadata. Here we will initialize simple measurement with just one RR channel:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurement-init --channel '{"data_enc": [["value", "H"]], "description": "My measurement", "label": "RR", "type": "RRI"}'
```
Expected response:
```json
{"measure_id": "d6a4666e-8f78-4c2b-b555-19cf45a7da8d", "status': "ok"}
```
Note the returned measure_id, we will use it in the next steps.

#### Data chunks

Measuremed data is added to the session in one or many chunk(s). You could add data points from commandline with ``--data`` argument, but here we will load them from a file with ``--data--file``:

 ```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurement-data --measurement-id d6a4666e-8f78-4c2b-b555-19cf45a7da8d --data-file rr_sample_1.txt
```
We could add more data to the measurement session with similar subsequent calls, however we would need to specify ``--chunk-seq`` parameter with increasing value. See [Kubioscloud documentation](https://analysis.kubioscloud.com/v1/portal/documentation/apis.html#submit-measurement-data) for details.

#### Finalizing measurement

Measurement session is closed with finalize call. Demo app will also ask for HRV analysis for data of the first channel.

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurement-final --measurement-id d6a4666e-8f78-4c2b-b555-19cf45a7da8d
```

### Fetching measurement data

Measurements can be listed with:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurements-list
```

which will print list containing all measurements for the user. Details of one measurement can be fetched with:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurement-info d6a4666e-8f78-4c2b-b555-19cf45a7da8d
```

Measurement data is available in temporary ``data_url`` given in response. Data is packed according to given ``data_enc`` encoding. Demo app will decode the data when downloaded with:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml measurement-download d6a4666e-8f78-4c2b-b555-19cf45a7da8d
```

### Previous results

Previous HRV analysis results can be listed with:

```bash
❯ python -m kubioscloud_demos --tokens-file tokens.yaml results-list
```
