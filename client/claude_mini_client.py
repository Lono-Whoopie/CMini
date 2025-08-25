#!/usr/bin/env python3
"""
Claude Mini Client - Helper for interacting with M4 Pro Mini Dev Server
This module is automatically available to Claude for offloading heavy tasks.
"""

import os
import json
import time
import requests
from typing import Dict, Any, Optional, List
from pathlib import Path

class ClaudeMiniClient:
    """Client for interacting with the M4 Pro Mini development server."""
    
    def __init__(self):
        """Initialize client with environment variables or defaults."""
        self.server_url = os.getenv('CLAUDE_DEV_SERVER', 'http://100.114.129.95:3001')
        self.ollama_url = os.getenv('CLAUDE_OLLAMA_HOST', 'http://100.114.129.95:11434')
        self.mini_ip = os.getenv('CLAUDE_MINI_IP', '100.114.129.95')
        
    def submit_task(self, 
                   task_type: str, 
                   content: str, 
                   context: str = "",
                   priority: int = 0,
                   wait: bool = False,
                   timeout: int = 300) -> Dict[str, Any]:
        """
        Submit a development task to the Mini's queue.
        
        Args:
            task_type: Type of task (code-analysis, code-generation, etc.)
            content: Main content to process
            context: Additional context for the task
            priority: Job priority (higher = more urgent)
            wait: If True, wait for job completion
            timeout: Max seconds to wait if wait=True
            
        Returns:
            Job info dict with job_id, or result if wait=True
        """
        response = requests.post(
            f"{self.server_url}/api/dev-task",
            json={
                "task_type": task_type,
                "content": content,
                "context": context,
                "priority": priority
            }
        )
        response.raise_for_status()
        result = response.json()
        
        if wait and result.get('success'):
            return self.wait_for_job(result['job_id'], timeout)
        
        return result
    
    def check_job(self, job_id: str) -> Dict[str, Any]:
        """Check the status of a submitted job."""
        response = requests.get(f"{self.server_url}/api/job/{job_id}")
        response.raise_for_status()
        return response.json()
    
    def wait_for_job(self, job_id: str, timeout: int = 300) -> Dict[str, Any]:
        """Wait for a job to complete and return its result."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            job_status = self.check_job(job_id)
            
            if job_status['state'] == 'completed':
                return job_status
            elif job_status['state'] == 'failed':
                raise Exception(f"Job failed: {job_status.get('failedReason')}")
            
            time.sleep(2)
        
        raise TimeoutError(f"Job {job_id} did not complete within {timeout} seconds")
    
    def analyze_code(self, code: str, wait: bool = True) -> Dict[str, Any]:
        """Analyze code for quality, issues, and improvements."""
        return self.submit_task('code-analysis', code, wait=wait)
    
    def generate_code(self, requirements: str, context: str = "", wait: bool = True) -> Dict[str, Any]:
        """Generate code based on requirements."""
        return self.submit_task('code-generation', requirements, context, wait=wait)
    
    def refactor_code(self, code: str, wait: bool = True) -> Dict[str, Any]:
        """Refactor code for better quality and maintainability."""
        return self.submit_task('code-refactor', code, wait=wait)
    
    def debug_code(self, code: str, error_info: str, wait: bool = True) -> Dict[str, Any]:
        """Debug code with error information."""
        return self.submit_task('debugging', code, error_info, wait=wait)
    
    def generate_docs(self, code: str, wait: bool = True) -> Dict[str, Any]:
        """Generate documentation for code."""
        return self.submit_task('documentation', code, wait=wait)
    
    def generate_tests(self, code: str, wait: bool = True) -> Dict[str, Any]:
        """Generate test suite for code."""
        return self.submit_task('testing', code, wait=wait)
    
    def query_ollama(self, 
                    prompt: str, 
                    model: str = "qwen2.5-coder:32b-instruct-q4_K_M",
                    temperature: float = 0.3,
                    max_tokens: int = 8192) -> str:
        """
        Query Ollama directly for immediate LLM response.
        
        Args:
            prompt: The prompt to send
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                },
                "stream": False
            },
            timeout=600
        )
        response.raise_for_status()
        return response.json()['response']
    
    def get_server_health(self) -> Dict[str, Any]:
        """Check the health of the task queue server."""
        response = requests.get(f"{self.server_url}/health")
        response.raise_for_status()
        return response.json()
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get statistics about the task queue."""
        response = requests.get(f"{self.server_url}/api/stats")
        response.raise_for_status()
        return response.json()
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get list of configured and installed models."""
        response = requests.get(f"{self.server_url}/api/models")
        response.raise_for_status()
        return response.json()
    
    def process_file(self, file_path: str, task_type: str, context: str = "") -> Dict[str, Any]:
        """Process a file by uploading it to the Mini."""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'task_type': task_type, 'context': context}
            response = requests.post(
                f"{self.server_url}/api/process-file",
                files=files,
                data=data
            )
        response.raise_for_status()
        return response.json()
    
    def execute_crew(self, 
                     task_description: str,
                     context: str = "",
                     process_type: str = "sequential",
                     wait: bool = False) -> Dict[str, Any]:
        """
        Execute a CrewAI crew for complex multi-agent tasks.
        
        Args:
            task_description: What the crew should accomplish
            context: Additional context for the crew
            process_type: "sequential" or "hierarchical"
            wait: If True, wait for completion (not recommended for long tasks)
            
        Returns:
            Job info with job_id, or result if wait=True
        """
        response = requests.post(
            f"{self.server_url}/api/execute-crew",
            json={
                "task_description": task_description,
                "context": context,
                "process_type": process_type
            }
        )
        response.raise_for_status()
        result = response.json()
        
        if wait and result.get('success'):
            # Not recommended for crews as they can run for days
            print("Warning: Waiting for crew completion. This may take hours or days...")
            return self.wait_for_job(result['job_id'], timeout=86400)  # 24 hour timeout
        
        return result
    
    def execute_autogen(self,
                       task_description: str,
                       initial_message: str = "",
                       max_rounds: int = 10,
                       context: str = "",
                       wait: bool = False) -> Dict[str, Any]:
        """
        Execute an AutoGen team for multi-agent conversations.
        
        Args:
            task_description: What the team should accomplish
            initial_message: Starting message for the conversation
            max_rounds: Maximum conversation rounds
            context: Additional context
            wait: If True, wait for completion (not recommended)
            
        Returns:
            Job info with job_id, or result if wait=True
        """
        response = requests.post(
            f"{self.server_url}/api/execute-autogen",
            json={
                "task_description": task_description,
                "initial_message": initial_message or task_description,
                "max_rounds": max_rounds,
                "context": context
            }
        )
        response.raise_for_status()
        result = response.json()
        
        if wait and result.get('success'):
            # Not recommended for teams as they can run for days
            print("Warning: Waiting for team completion. This may take hours or days...")
            return self.wait_for_job(result['job_id'], timeout=86400)  # 24 hour timeout
        
        return result
    
    def batch_analyze(self, code_files: List[str], wait: bool = True) -> List[Dict[str, Any]]:
        """Analyze multiple code files in parallel."""
        jobs = []
        
        # Submit all jobs
        for file_path in code_files:
            with open(file_path, 'r') as f:
                content = f.read()
            job = self.submit_task('code-analysis', content, wait=False)
            jobs.append({'file': file_path, 'job_id': job['job_id']})
        
        if not wait:
            return jobs
        
        # Wait for all jobs to complete
        results = []
        for job_info in jobs:
            try:
                result = self.wait_for_job(job_info['job_id'])
                results.append({
                    'file': job_info['file'],
                    'result': result
                })
            except Exception as e:
                results.append({
                    'file': job_info['file'],
                    'error': str(e)
                })
        
        return results

# Create global instance
mini_client = ClaudeMiniClient()

# Convenience functions for direct use
def analyze_on_mini(code: str) -> str:
    """Quick function to analyze code on Mini."""
    result = mini_client.analyze_code(code)
    return result['result']['result'] if result.get('result') else str(result)

def generate_on_mini(requirements: str, context: str = "") -> str:
    """Quick function to generate code on Mini."""
    result = mini_client.generate_code(requirements, context)
    return result['result']['result'] if result.get('result') else str(result)

def ask_mini(prompt: str, model: str = "qwen2.5-coder:32b-instruct-q4_K_M") -> str:
    """Quick function to query Mini's LLM directly."""
    return mini_client.query_ollama(prompt, model)

if __name__ == "__main__":
    # Quick test
    print("Testing connection to Mini Dev Server...")
    try:
        health = mini_client.get_server_health()
        print(f"✅ Server is {health['status']}")
        
        stats = mini_client.get_queue_stats()
        print(f"📊 Queue stats: {stats['stats']}")
        
        models = mini_client.get_available_models()
        print(f"🤖 Installed models: {len(models['installed'])}")
        for model in models['installed']:
            print(f"  - {model}")
    except Exception as e:
        print(f"❌ Error: {e}")