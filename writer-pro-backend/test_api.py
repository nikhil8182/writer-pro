import requests
import json

BASE_URL = "http://localhost:8000"

def test_generate_outline():
    """Test the outline generation endpoint"""
    print("\n=== Testing Generate Outline API ===")
    
    payload = {
        "contentDescription": "Write about the benefits of AI in content creation",
        "contentType": "motivation",
        "base_system_instruction": "You are an expert content creator assistant."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate-outline", json=payload, timeout=30)
        
        # Print response status
        print(f"Status Code: {response.status_code}")
        
        # Print response headers for debugging
        print("Headers:", response.headers)
        
        # Try to get JSON response
        try:
            data = response.json()
            print("Response JSON:", json.dumps(data, indent=2))
            
            if "outline" in data:
                print("\n=== Generated Outline ===")
                print(data["outline"][:500] + "..." if len(data["outline"]) > 500 else data["outline"])
                print("==========================")
                return True
            else:
                print("Error: 'outline' field missing in response")
                return False
                
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            print("Raw response:", response.text[:1000])
            return False
            
    except Exception as e:
        print(f"Request error: {e}")
        return False

def test_optimize_content():
    """Test the content optimization endpoint"""
    print("\n=== Testing Optimize Content API ===")
    
    payload = {
        "content": "AI has transformed how we create and manage content. It helps with generating ideas, drafting content, and optimizing for different audiences.",
        "platform": "twitter",
        "contentType": "info",
        "base_system_instruction": "You are an expert content optimizer assistant."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/optimize-content", json=payload, timeout=30)
        
        # Print response status
        print(f"Status Code: {response.status_code}")
        
        # Try to get JSON response
        try:
            data = response.json()
            print("Response JSON:", json.dumps(data, indent=2))
            
            if "optimizedContent" in data:
                print("\n=== Optimized Content ===")
                print(data["optimizedContent"])
                print("==========================")
                return True
            else:
                print("Error: 'optimizedContent' field missing in response")
                return False
                
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            print("Raw response:", response.text[:1000])
            return False
            
    except Exception as e:
        print(f"Request error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Writer Pro Backend API...")
    
    # Test outline generation
    outline_success = test_generate_outline()
    
    # Test content optimization
    optimize_success = test_optimize_content()
    
    # Print summary
    print("\n=== Test Summary ===")
    print(f"Generate Outline: {'✅ Success' if outline_success else '❌ Failed'}")
    print(f"Optimize Content: {'✅ Success' if optimize_success else '❌ Failed'}") 