import os
from setuptools import setup, find_packages

with open(os.path.join(os.path.dirname(__file__), 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="triagetalon",
    version="1.0.0",
    description="Advanced Reconnaissance & Attack Surface Filtration for Bug Bounty Hunters",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="BMNTR",
    url="https://github.com/BMNTR/TriageTalon",
    packages=find_packages(),
    py_modules=["recon"],
    install_requires=[
        "requests",
        "rich",
        "prompt_toolkit>=3.0.0",
        "click>=8.0.0",
    ],
    entry_points={
        "console_scripts": [
            "talon=recon:main",
        ],
    },
)
