"""Setup.py for project."""
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements. See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership. The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied. See the License for the
# specific language governing permissions and limitations
# under the License.
#

from setuptools import find_packages, setup  # type: ignore

from git_version import version as git_version

classifiers = [
    # How mature is this project? Common values are
    #   2 - Pre-Alpha
    #   3 - Alpha
    #   4 - Beta
    #   5 - Production/Stable
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "Programming Language :: Python :: 3.7",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: Implementation :: CPython",
    "License :: OSI Approved :: Apache Software License",
]

# Project runtime requirements.
install_require = [
    "requests ~= 2.25.1",
    "typer ~= 0.3.2",
    "PyYaml ~= 5.3.1",
    "rich ~= 9.7.0",
    "msgpack ~= 1.0.2",
    "jsons ~= 1.3.1",
]

# Tools for running tests etc. but which are not required for software to run in production.
tests_require = [
    "coverage",
    "black == 20.8b1",
    "mypy",
    "pytest ~= 6.2.1",
    "flake8 ~= 3.8.4",
    "pytest-flake8 ~= 1.0.7",
    "pytest-mypy ~= 0.8.0",
    "pytest-black ~= 0.3.12",
    "pytest-isort ~= 1.2.0",
    "pytest-cov",
    "pytest-pylint",
    "pytest-xdist",
    "pytest-timeout",
    "setuptools>=12",
    "wheel",
]

with open("README.md", encoding="utf-8") as f:
    readme = f.read()

setup(
    name="kubioscloud-demo",
    description="KubiosCloud usage demos",
    license="Apache License 2.0",
    url="https://www.kubios.com/",
    long_description=readme,
    version=git_version,
    author="Perttu Ranta-aho",
    author_email="perttu.ranta-aho@kubios.com",
    zip_safe=False,
    packages=find_packages("."),
    classifiers=classifiers,
    install_requires=install_require,
    extras_require={"dev": tests_require},
    setup_requires=("pytest-runner",),
    include_package_data=True,
)
