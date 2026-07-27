from setuptools import setup, find_packages

setup(
    name="triagetalon",
    version="1.0.0",
    description="Advanced Reconnaissance & Attack Surface Filtration for Bug Bounty Hunters",
    author="BMNTR",
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
