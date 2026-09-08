import os
import uuid
import requests
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()


def build_prompt(topic, class_name):
    if class_name <= 5:
        return (
            f"Cute colorful educational cartoon illustration of {topic}, "
            f"for Class {class_name} students, "
            "happy children learning, classroom environment, "
            "bright colors, simple objects, textbook style, "
            "white background, high quality"
        )
    elif class_name <= 8:
        return (
            f"Educational infographic about {topic}, "
            f"for Class {class_name} students, "
            "clear labelled diagram, modern textbook illustration, "
            "easy learning, colorful, high quality"
        )
    else:
        return (
            f"Scientific educational illustration of {topic}, "
            f"for Class {class_name}, "
            "detailed diagram, labelled parts, professional textbook style, "
            "white background, high resolution"
        )


def generate_image(topic, class_name):
    folder = "images"
    os.makedirs(folder, exist_ok=True)

    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(folder, filename)
    prompt = build_prompt(topic, class_name)

    print("IMAGE PROMPT:", prompt)

    provider = os.getenv("IMAGE_PROVIDER", "google").lower()
    api_key = (
        os.getenv("IMAGE_API_KEY") or
        os.getenv("GOOGLE_API_KEY") or
        os.getenv("OPENAI_API_KEY") or
        os.getenv("POLLINATIONS_API_KEY") or
        os.getenv("Pollinations_API_KEY")
    )

    # 1. Groq / Flux / SD XL Provider
    if provider in ["groq"]:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            # Try Groq image endpoint if available, else fall through to pollinations/google
            try:
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                data = {"prompt": prompt, "model": "flux-schnell"}
                res = requests.post("https://api.groq.com/openai/v1/images/generations", headers=headers, json=data, timeout=60)
                if res.status_code == 200:
                    img_url = res.json()["data"][0]["url"]
                    img_res = requests.get(img_url, timeout=60)
                    if img_res.status_code == 200:
                        with open(filepath, "wb") as f:
                            f.write(img_res.content)
                        return filepath
            except Exception as groq_err:
                print(f"Groq direct image gen unavailable ({groq_err}), using Pollinations fallback.")

    # 2. Google Gemini / Imagen Provider
    if provider in ["google", "gemini", "imagen", "google-genai"]:
        google_key = os.getenv("GOOGLE_API_KEY") or api_key
        if not google_key:
            raise Exception("GOOGLE_API_KEY is required for Google Gemini/Imagen image generation.")

        # Try using google-genai SDK first
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=google_key)
            result = client.models.generate_images(
                model='imagen-3.0-generate-002',
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    output_mime_type="image/png",
                    aspect_ratio="1:1"
                )
            )
            if result.generated_images:
                generated_image = result.generated_images[0]
                with open(filepath, "wb") as f:
                    f.write(generated_image.image.image_bytes)
                return filepath
        except Exception as genai_err:
            print(f"Google GenAI SDK image generation error: {genai_err}. Falling back to REST API.")
            # Fallback REST endpoint for Imagen via Gemini API
            res = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={google_key}",
                json={
                    "instances": [{"prompt": prompt}],
                    "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
                },
                timeout=120
            )
            if res.status_code == 200:
                res_data = res.json()
                if "predictions" in res_data and len(res_data["predictions"]) > 0:
                    b64_bytes = res_data["predictions"][0]["bytesBase64Encoded"]
                    import base64
                    with open(filepath, "wb") as f:
                        f.write(base64.b64decode(b64_bytes))
                    return filepath
            print(f"Imagen REST failed with status {res.status_code}: {res.text}. Falling back to Pollinations.")

    # 2. OpenAI DALL-E Provider
    if provider in ["openai", "dalle", "dall-e"]:
        openai_key = os.getenv("OPENAI_API_KEY") or api_key
        if not openai_key:
            raise Exception("OPENAI_API_KEY is required for OpenAI image generation.")

        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024"
        }
        res = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=data, timeout=120)
        if res.status_code == 200:
            img_url = res.json()["data"][0]["url"]
            img_res = requests.get(img_url, timeout=120)
            if img_res.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(img_res.content)
                return filepath
        raise Exception(f"OpenAI Image Generation failed: {res.text}")

    # 3. Pollinations / Free Provider Fallback
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = f"https://image.pollinations.ai/prompt/{quote(prompt)}"
    if api_key:
        url += f"?key={quote(api_key)}"

    response = requests.get(url, headers=headers, timeout=120)

    if response.status_code == 200:
        with open(filepath, "wb") as f:
            f.write(response.content)
        print("Image saved:", filepath)
        return filepath

    raise Exception(f"Image generation failed with status {response.status_code}: {response.text}")