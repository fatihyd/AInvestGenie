import os
import openai
import dotenv
import logging
import re
import json

dotenv.load_dotenv()

endpoint = os.getenv("AZURE_OAI_ENDPOINT")
api_key = os.getenv("AZURE_OAI_KEY")
deployment = os.getenv("AZURE_OAI_DEPLOYMENT")
promt = os.getenv("SystemPromt")
client = openai.AzureOpenAI(base_url=f"{endpoint}/openai/deployments/{deployment}/extensions",
                            api_key= api_key,
                            api_version="2023-08-01-preview")

def main():
    try:
        while True:
            text = input("\nEnter the prompt:\n")
            if text.lower() == "exit":
                print("Exiting...")
                break
            
            response = client.chat.completions.create(
                        model = deployment,
                        temperature= 0.7,
                        max_tokens= 4096,
                        top_p=0.95,
                        messages = [
                            {
                                "role":"system",
                                "content": promt

                            },
                            {   
                                "role":"user",
                                "content": text
                            },
                        ],
                        extra_body={
                            "dataSources":[
                                {
                                    "type":"AzureCognitiveSearch",
                                    "parameters":{
                                        "endpoint": os.environ["AZURE_SEARCH_ENDPOINT"],
                                        "key": os.environ["AZURE_SEARCH_KEY"],
                                        "indexName": os.environ["AZURE_SEARCH_INDEX"],
                                        "query_type": "semantic",
                                        "semanticConfiguration":"Config"
                                    }
                                }
                            ]
                        }
                    )
            content = response.choices[0].message.content
            content = re.sub(r"\[doc.*\]", "", content) # reference removal [doc.]
            print(content)

    except Exception as e:
        logging.error(f"An error occured: {e}")
        print(e)

if __name__ == "__main__":
    main()