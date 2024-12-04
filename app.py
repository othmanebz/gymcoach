from flask import Flask, request, jsonify
from transformers import BertTokenizer, BertModel
from weaviate.client import Client
import torch
import numpy as np
import google.generativeai as genai  # Correct import for Google Generative AI

# Set your API key for Google Generative AI
genai.configure(api_key="AIzaSyCyozUFATzkithJMTeC2Q2gJjRejcNuX5M")
geminyflash = genai.GenerativeModel("gemini-1.5-flash")


weaviate_client = Client("http://localhost:8080") 

# Schema for Weaviate
schema_definition = {
    "class": "Document",
    "properties": [
        {"name": "text", "dataType": ["text"], "description": "The content of the document"}
    ],
}

if not weaviate_client.schema.contains(schema_definition):
    weaviate_client.schema.create({"classes": [schema_definition]})

# Initialize BERT tokenizer and model for embedding generation
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

app = Flask(__name__)

# Generate embeddings
def generate_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
    return embeddings

# Route to add a document
@app.route('/add_document', methods=['POST'])
def add_document():
    try:
        data = request.get_json()
        document_text = data['text']

        embedding = generate_embedding(document_text)

        # Store document in Weaviate
        response = weaviate_client.data_object.create(
            data_object={"text": document_text},
            class_name="Document",
            vector=embedding.tolist(),
        )

        return jsonify({"message": "Document added successfully", "id": response}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Route to query documents and generate a response
@app.route('/query', methods=['POST'])
def query():
    try:
        data = request.get_json()
        query_text = data['query']

        query_embedding = generate_embedding(query_text)

        results = weaviate_client.query.get("Document", ["text"]).with_near_vector(
            {"vector": query_embedding.tolist()}
        ).with_limit(3).do()

        # Extract the document texts
        documents = [result["text"] for result in results["data"]["Get"]["Document"]]

        # Combine the similar documents as context for Gemini
        context = " ".join(documents)

        # Generate a response using Google Generative AI
        gemini_prompt = f"Given the following context, answer the query: {context}\n\nQuery: {query_text}\nAnswer:"
        
        gemini_response = geminyflash.generate_content(gemini_prompt)

        # Get the generated answer
        answer = gemini_response.text.strip()

        return jsonify({"answer": answer, "similar_documents": documents}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
