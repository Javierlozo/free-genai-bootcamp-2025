## Running Ollama Third-Party Service

### Choosing a Model

Choosing a model_id from https://ollama.com/library

eg. https://ollama.com/library/llama3.2

### Getting the Host IP

HOST_IP==$(hostname -I | awk '{print $1}') NO_PROXY=localhost LLM_ENDPOINT_PORT=8008 LLM_MODEL_ID="llama3.2:1b" host_ip=10.0.0.167 docker compose up

### Ollama API

Once the Ollama server is running we can make API calls to the ollama API

https://github.com/ollama/ollama/blob/main/docs/api.md

### Generate a Request

#### Need to pull the model.

curl http://localhost:8008/api/pull -d '{
"model": "llama3.2:1b"
}'

#### Once the download is complete, then you can try your original query.

curl http://localhost:8008/api/generate -d '{
"model": "llama3.2:1b",
"prompt": "Why is the sky blue?"
}'
