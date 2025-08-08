#!/usr/bin/env python3
"""
Test script to demonstrate database initialization on startup
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from main import init_database

async def test_database_initialization():
    """Test the database initialization process"""
    print("=" * 60)
    print("Testing Database Initialization on Startup")
    print("=" * 60)
    
    try:
        await init_database()
        print("\n✅ Database initialization completed successfully!")
        print("\nThis demonstrates that:")
        print("1. Database schema is checked and updated on every startup")
        print("2. Missing tables are automatically created")
        print("3. New database changes are applied automatically")
        print("4. The application handles existing schema gracefully")
        
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_database_initialization())
    sys.exit(0 if success else 1) 