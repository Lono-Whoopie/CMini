#!/usr/bin/env python3
"""
CrewAI Expert Client for CMini
Simplifies crew creation by using the expert service on the Mini
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Configuration
MINI_IP = "100.114.129.95"
TASK_QUEUE_PORT = 3001
BASE_URL = f"http://{MINI_IP}:{TASK_QUEUE_PORT}"

class Priority(Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"

class CrewPattern(Enum):
    CODE_REVIEW = "code-review"
    API_DEVELOPMENT = "api-development"
    DEBUGGING = "debugging"
    ARCHITECTURE_DESIGN = "architecture-design"
    DATA_ANALYSIS = "data-analysis"
    REFACTORING = "refactoring"

@dataclass
class CrewRequest:
    """Simple crew request structure"""
    description: str
    context: Optional[str] = None
    files: Optional[List[str]] = None
    priority: Priority = Priority.NORMAL

@dataclass
class AdvancedCrewRequest:
    """Advanced crew request with full control"""
    task_description: str
    context: Optional[str] = None
    requirements: Optional[List[str]] = None
    files: Optional[List[str]] = None
    priority: Priority = Priority.NORMAL
    process_type: Optional[str] = None
    max_iterations: int = 10
    custom_agents: Optional[List[Dict]] = None
    custom_tasks: Optional[List[Dict]] = None

class CrewAIExpertClient:
    """Client for interacting with the CrewAI Expert Service"""
    
    def __init__(self, base_url: str = BASE_URL, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["X-API-Key"] = api_key
    
    def simple_crew(self, description: str, context: str = "", 
                   files: List[str] = None, priority: str = "normal") -> Dict:
        """
        Create a crew using simple description
        The expert service will determine the best crew configuration
        
        Examples:
            client.simple_crew("Review this authentication code for security issues")
            client.simple_crew("Build a REST API for user management", context="Node.js Express")
            client.simple_crew("Debug the memory leak in the application", priority="high")
        """
        request = CrewRequest(
            description=description,
            context=context,
            files=files or [],
            priority=Priority(priority)
        )
        
        response = requests.post(
            f"{self.base_url}/api/crew/simple",
            json={
                "description": request.description,
                "context": request.context,
                "files": request.files,
                "priority": request.priority.value
            },
            headers=self.headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Expert crew created: {result['crew_name']}")
            print(f"📋 Pattern used: {result['pattern_used']}")
            print(f"🆔 Job ID: {result['job_id']}")
            print(f"⏱️  Estimated time: {result['estimated_time']}s")
            return result
        else:
            print(f"❌ Failed to create crew: {response.text}")
            return None
    
    def analyze_request(self, description: str, context: str = "", 
                       requirements: List[str] = None) -> Dict:
        """
        Analyze what crew configuration would be used without executing
        Useful for previewing what the expert system would create
        """
        response = requests.post(
            f"{self.base_url}/api/crew/analyze",
            json={
                "description": description,
                "context": context,
                "requirements": requirements or []
            },
            headers=self.headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n🔍 Crew Analysis for: {description[:50]}...")
            print(f"📊 Pattern: {result['pattern']}")
            print(f"👥 Agents: {len(result['agents'])} agents")
            for agent in result['agents']:
                print(f"   - {agent['role']}: {agent['goal'][:60]}...")
            print(f"📝 Tasks: {len(result['tasks'])} tasks")
            print(f"⏱️  Total estimated time: {result['estimated_total_time']}s")
            print(f"🔄 Process type: {result['process_type']}")
            return result
        else:
            print(f"❌ Analysis failed: {response.text}")
            return None
    
    def advanced_crew(self, request: AdvancedCrewRequest) -> Dict:
        """
        Create a crew with full control over configuration
        For power users who want to customize agents and tasks
        """
        payload = {
            "task_description": request.task_description,
            "context": request.context,
            "requirements": request.requirements,
            "files": request.files,
            "priority": request.priority.value,
            "process_type": request.process_type,
            "max_iterations": request.max_iterations
        }
        
        if request.custom_agents:
            payload["custom_agents"] = request.custom_agents
        if request.custom_tasks:
            payload["custom_tasks"] = request.custom_tasks
        
        response = requests.post(
            f"{self.base_url}/api/crew/advanced",
            json=payload,
            headers=self.headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Advanced crew created: {result['crew_name']}")
            print(f"👥 Agents: {result['agent_count']}")
            print(f"📝 Tasks: {result['task_count']}")
            print(f"🆔 Job ID: {result['job_id']}")
            print(f"⏱️  Estimated time: {result['estimated_time']}s")
            return result
        else:
            print(f"❌ Failed to create advanced crew: {response.text}")
            return None
    
    def get_patterns(self) -> List[Dict]:
        """Get all available crew patterns"""
        response = requests.get(
            f"{self.base_url}/api/crew/patterns",
            headers=self.headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n📚 Available Crew Patterns ({result['total']} patterns)")
            print("=" * 60)
            for pattern in result['patterns']:
                print(f"\n🔹 {pattern['name']} ({pattern['key']})")
                print(f"   {pattern['description']}")
                print(f"   Agents: {pattern['agent_count']} | Process: {pattern['process_type']}")
                print(f"   Use cases:")
                for use_case in pattern['use_cases']:
                    print(f"     • {use_case}")
            return result['patterns']
        else:
            print(f"❌ Failed to get patterns: {response.text}")
            return []
    
    def get_crew_status(self, job_id: str) -> Dict:
        """Get detailed status of a crew execution"""
        response = requests.get(
            f"{self.base_url}/api/crew/status/{job_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n📊 Crew Status for Job {job_id}")
            print(f"State: {result['state']}")
            print(f"Progress: {result['progress']}%")
            if 'crew_info' in result and result['crew_info']:
                info = result['crew_info']
                print(f"Crew: {info.get('crew_name', 'Unknown')}")
                if info.get('current_task'):
                    print(f"Current task: {info['current_task'].get('description', 'Unknown')}")
                if info.get('completed_tasks'):
                    print(f"Completed: {', '.join(info['completed_tasks'])}")
            return result
        else:
            print(f"❌ Failed to get status: {response.text}")
            return None
    
    def wait_for_crew(self, job_id: str, check_interval: int = 10, 
                     max_wait: int = 3600) -> Dict:
        """
        Wait for a crew to complete with progress updates
        
        Args:
            job_id: The job ID to monitor
            check_interval: Seconds between status checks
            max_wait: Maximum seconds to wait before timeout
        """
        print(f"\n⏳ Waiting for crew job {job_id} to complete...")
        start_time = time.time()
        last_progress = -1
        
        while (time.time() - start_time) < max_wait:
            status = self.get_crew_status(job_id)
            
            if not status:
                print("Failed to get status, retrying...")
                time.sleep(check_interval)
                continue
            
            current_progress = status.get('progress', 0)
            if current_progress != last_progress:
                print(f"Progress: {current_progress}%")
                last_progress = current_progress
            
            if status['state'] == 'completed':
                print(f"✅ Crew completed successfully!")
                return self.get_job_result(job_id)
            elif status['state'] == 'failed':
                print(f"❌ Crew failed!")
                return status
            
            time.sleep(check_interval)
        
        print(f"⏱️ Timeout waiting for crew after {max_wait} seconds")
        return None
    
    def get_job_result(self, job_id: str) -> Dict:
        """Get the final result of a completed job"""
        response = requests.get(
            f"{self.base_url}/api/job/{job_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Failed to get job result: {response.text}")
            return None

# Convenience functions for common patterns
def review_code(description: str, files: List[str] = None, 
                context: str = "") -> Dict:
    """Quick function to create a code review crew"""
    client = CrewAIExpertClient()
    return client.simple_crew(
        f"Review this code: {description}",
        context=context,
        files=files,
        priority="normal"
    )

def build_api(description: str, context: str = "") -> Dict:
    """Quick function to create an API development crew"""
    client = CrewAIExpertClient()
    return client.simple_crew(
        f"Build an API: {description}",
        context=context,
        priority="normal"
    )

def debug_issue(description: str, context: str = "", 
                priority: str = "high") -> Dict:
    """Quick function to create a debugging crew"""
    client = CrewAIExpertClient()
    return client.simple_crew(
        f"Debug this issue: {description}",
        context=context,
        priority=priority
    )

def design_system(description: str, requirements: List[str] = None) -> Dict:
    """Quick function to create an architecture design crew"""
    client = CrewAIExpertClient()
    if requirements:
        # Use advanced for requirements
        return client.advanced_crew(
            AdvancedCrewRequest(
                task_description=f"Design system: {description}",
                requirements=requirements,
                priority=Priority.NORMAL
            )
        )
    else:
        return client.simple_crew(f"Design the architecture for: {description}")

def analyze_data(description: str, files: List[str] = None) -> Dict:
    """Quick function to create a data analysis crew"""
    client = CrewAIExpertClient()
    return client.simple_crew(
        f"Analyze this data: {description}",
        files=files,
        priority="normal"
    )

def refactor_code(description: str, files: List[str] = None,
                 context: str = "") -> Dict:
    """Quick function to create a refactoring crew"""
    client = CrewAIExpertClient()
    return client.simple_crew(
        f"Refactor this code: {description}",
        context=context,
        files=files,
        priority="normal"
    )

def nist_compliance(description: str, framework: str = "CSF",
                   context: str = "") -> Dict:
    """Quick function to create a NIST compliance crew
    
    Args:
        description: What to assess or implement
        framework: Which NIST framework (CSF, 800-53, 800-171, RMF)
        context: Additional context about the environment
    """
    client = CrewAIExpertClient()
    full_description = f"NIST {framework} compliance: {description}"
    return client.simple_crew(
        full_description,
        context=context,
        priority="high"  # Compliance is usually high priority
    )

def cmmc_assessment(description: str, level: int = 2,
                   context: str = "") -> Dict:
    """Quick function to create a CMMC assessment crew
    
    Args:
        description: What to assess or implement
        level: CMMC Level (1, 2, or 3)
        context: Additional context about the organization
    """
    client = CrewAIExpertClient()
    full_description = f"CMMC Level {level} assessment: {description}"
    return client.simple_crew(
        full_description,
        context=context,
        priority="high"  # CMMC is critical for DoD contractors
    )

def compliance_gap_analysis(standard: str, description: str = "",
                          files: List[str] = None) -> Dict:
    """Quick function for compliance gap analysis
    
    Args:
        standard: Compliance standard (NIST, CMMC, ISO27001, etc.)
        description: Specific areas to focus on
        files: Relevant documentation or policies
    """
    client = CrewAIExpertClient()
    full_description = f"{standard} gap analysis"
    if description:
        full_description += f": {description}"
    return client.simple_crew(
        full_description,
        files=files,
        priority="high"
    )

# Example usage
if __name__ == "__main__":
    client = CrewAIExpertClient()
    
    # Example 1: Simple code review
    print("\n" + "="*60)
    print("Example 1: Simple Code Review")
    print("="*60)
    result = client.simple_crew(
        "Review the authentication system for security vulnerabilities",
        context="Node.js Express app with JWT tokens",
        files=["auth.js", "middleware.js", "user.model.js"]
    )
    
    # Example 2: Analyze before executing
    print("\n" + "="*60)
    print("Example 2: Analyze Request First")
    print("="*60)
    analysis = client.analyze_request(
        "Build a REST API for user management",
        context="Python FastAPI with PostgreSQL"
    )
    
    # Example 3: Get available patterns
    print("\n" + "="*60)
    print("Example 3: Available Patterns")
    print("="*60)
    patterns = client.get_patterns()
    
    # Example 4: Advanced crew with custom configuration
    print("\n" + "="*60)
    print("Example 4: Advanced Crew")
    print("="*60)
    advanced_request = AdvancedCrewRequest(
        task_description="Optimize database queries in the application",
        context="PostgreSQL database with complex joins",
        requirements=[
            "Identify slow queries",
            "Suggest index improvements",
            "Rewrite inefficient queries"
        ],
        priority=Priority.HIGH,
        process_type="sequential",
        max_iterations=15
    )
    advanced_result = client.advanced_crew(advanced_request)
    
    # Example 5: Using convenience functions
    print("\n" + "="*60)
    print("Example 5: Convenience Functions")
    print("="*60)
    
    # Quick code review
    review_result = review_code(
        "authentication module",
        files=["auth.py", "test_auth.py"]
    )
    
    # Quick debugging
    debug_result = debug_issue(
        "Memory leak in the worker process",
        context="Python multiprocessing application",
        priority="high"
    )
    
    print("\n✅ All examples completed!")