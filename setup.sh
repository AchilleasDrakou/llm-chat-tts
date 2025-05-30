#!/bin/bash
# ================================================================
# LLM Chat TTS - Setup Script
# ================================================================
# This script sets up the LLM Chat TTS application with both
# frontend and backend components.
# ================================================================

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Set error handling
set -e
trap 'echo -e "${RED}An error occurred. Setup failed.${NC}"; exit 1' ERR

# Print banner
echo -e "${BLUE}================================================================${NC}"
echo -e "${CYAN}           LLM Chat TTS - Setup Script                          ${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "${CYAN}This script will set up the LLM Chat TTS application with:${NC}"
echo -e "${CYAN}- Next.js frontend${NC}"
echo -e "${CYAN}- FastAPI backend${NC}"
echo -e "${CYAN}- Chatterbox TTS integration${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Check if running from the correct directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: Please run this script from the root directory of the project.${NC}"
    echo -e "${YELLOW}The directory should contain both 'frontend' and 'backend' folders.${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required dependencies
echo -e "${BLUE}Checking for required dependencies...${NC}"

# Check for Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
    # Check if Node.js version is >= 16
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
    if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
        echo -e "${YELLOW}⚠ Warning: Node.js version should be 16 or higher. Please consider upgrading.${NC}"
    fi
else
    echo -e "${RED}✗ Node.js is not installed.${NC}"
    echo -e "${YELLOW}Please install Node.js (v16 or higher) from https://nodejs.org/${NC}"
    exit 1
fi

# Check for npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm is installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm is not installed.${NC}"
    echo -e "${YELLOW}Please install npm which comes with Node.js: https://nodejs.org/${NC}"
    exit 1
fi

# Check for Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python is installed: $PYTHON_VERSION${NC}"
    # Check if Python version is >= 3.8
    PYTHON_MAJOR_VERSION=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$PYTHON_MAJOR_VERSION" -lt 8 ]; then
        echo -e "${YELLOW}⚠ Warning: Python version should be 3.8 or higher. Please consider upgrading.${NC}"
    fi
else
    echo -e "${RED}✗ Python 3 is not installed.${NC}"
    echo -e "${YELLOW}Please install Python 3.8 or higher from https://www.python.org/downloads/${NC}"
    exit 1
fi

# Check for pip
if command_exists pip3; then
    PIP_VERSION=$(pip3 --version | awk '{print $2}')
    echo -e "${GREEN}✓ pip is installed: $PIP_VERSION${NC}"
else
    echo -e "${RED}✗ pip is not installed.${NC}"
    echo -e "${YELLOW}Please install pip which usually comes with Python: https://pip.pypa.io/en/stable/installation/${NC}"
    exit 1
fi

# Check for virtualenv
if command_exists virtualenv; then
    VENV_VERSION=$(virtualenv --version)
    echo -e "${GREEN}✓ virtualenv is installed: $VENV_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ virtualenv is not installed. Installing...${NC}"
    pip3 install virtualenv
    echo -e "${GREEN}✓ virtualenv installed successfully${NC}"
fi

# Check for CUDA (optional)
if command_exists nvidia-smi; then
    echo -e "${GREEN}✓ NVIDIA CUDA is available${NC}"
    CUDA_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ NVIDIA CUDA is not available. TTS will run on CPU (slower).${NC}"
    CUDA_AVAILABLE=false
fi

echo -e "${GREEN}All required dependencies are available.${NC}"
echo ""

# Ask for OpenAI API key
echo -e "${BLUE}Setting up configuration...${NC}"
read -p "Enter your OpenAI API key (press Enter to skip for now): " OPENAI_API_KEY

# Setup frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

echo -e "${CYAN}Installing frontend dependencies...${NC}"
npm install

echo -e "${GREEN}✓ Frontend setup completed${NC}"
cd ..

# Setup backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Create virtual environment
echo -e "${CYAN}Creating Python virtual environment...${NC}"
if [ -d ".venv" ]; then
    echo -e "${YELLOW}Virtual environment already exists. Skipping creation.${NC}"
else
    python3 -m virtualenv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${CYAN}Activating virtual environment...${NC}"
source .venv/bin/activate

# Install backend dependencies
echo -e "${CYAN}Installing backend dependencies (this may take a while)...${NC}"
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${CYAN}Creating .env file...${NC}"
    cp .env.example .env
    
    # Update OpenAI API key if provided
    if [ ! -z "$OPENAI_API_KEY" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your_openai_api_key_here/$OPENAI_API_KEY/g" .env
        else
            # Linux
            sed -i "s/your_openai_api_key_here/$OPENAI_API_KEY/g" .env
        fi
    fi
    
    # Set TTS device based on CUDA availability
    if [ "$CUDA_AVAILABLE" = true ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/TTS_DEVICE=cuda/TTS_DEVICE=cuda/g" .env
        else
            # Linux
            sed -i "s/TTS_DEVICE=cuda/TTS_DEVICE=cuda/g" .env
        fi
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/TTS_DEVICE=cuda/TTS_DEVICE=cpu/g" .env
        else
            # Linux
            sed -i "s/TTS_DEVICE=cuda/TTS_DEVICE=cpu/g" .env
        fi
    fi
    
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists. Skipping creation.${NC}"
    echo -e "${YELLOW}   If you want to update it, please edit it manually or delete it and run this script again.${NC}"
fi

# Create cache directory
echo -e "${CYAN}Creating cache directory...${NC}"
mkdir -p cache
mkdir -p logs

echo -e "${GREEN}✓ Backend setup completed${NC}"

# Deactivate virtual environment
deactivate
cd ..

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "${CYAN}To start the application:${NC}"
echo -e ""
echo -e "${YELLOW}1. Start the backend:${NC}"
echo -e "   cd backend"
echo -e "   source .venv/bin/activate"
echo -e "   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo -e ""
echo -e "${YELLOW}2. In a new terminal, start the frontend:${NC}"
echo -e "   cd frontend"
echo -e "   npm run dev"
echo -e ""
echo -e "${YELLOW}3. Open your browser and go to:${NC}"
echo -e "   http://localhost:3000"
echo -e ""
echo -e "${PURPLE}Note: The first time you run the backend, it will download the Chatterbox TTS model,${NC}"
echo -e "${PURPLE}      which may take some time depending on your internet connection.${NC}"
echo -e ""

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}⚠ You didn't provide an OpenAI API key.${NC}"
    echo -e "${RED}  You'll need to add it to backend/.env before using the chat functionality.${NC}"
    echo -e ""
fi

echo -e "${BLUE}================================================================${NC}"
echo -e "${CYAN}Thank you for using LLM Chat TTS!${NC}"
echo -e "${BLUE}================================================================${NC}"
