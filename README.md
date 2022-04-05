# Towards Better Person Re-Identification through Interactive Visual Exploration and Incremental User Feedback

This repository contains source code used to explore and analyze the search space in person Re-Identification(Re-ID).

## Introduction

We propose ReIDVis , which is a novel data exploration and data visualization prototype for person re-identification (Re-ID). 
ReIDVis integrates a user-feedback mechanism that incorporates the person Re-ID model with human insights, and a composite visualization that support efficient visual browsing, retrieval, and exploration of candidate targets. To help identify person-of-interest, we propose an extended semi-supervised learning method by introducing a k-fusion post-rank algorithm to support incremental user feedback. In the visualization component, we develop a novel cluster-based visualization with an optimized layout to reduce visual occlusion and preserve user’s mental map. We also propose a multi-scale, pixel-based view to guide user exploration in the search space.

![avatar](/pipeline.jpg)

## System screenshots

The interface of the system. (A) the *probe panel* which allows users to select the person-of-interest (partially covered by an umbrella) as *probe* and set up the visual parameter of the search space. (B) the *search space view* to support exploration and provide feedback on the retrieval results. (C) the *spatiotemporal information view* which summarizes the spatiotemporal information of the retrieval results after three iterations. (D) the ranking list with the pixel-based visual encoding which allows users to quickly troubleshoot hard negative samples. (G) the ranking list with the raw image. (E) the exploration of the “path” node, where a front photo of the *probe* is found. (F) a *node* with the pixel-based visual encoding.

The system demonstration video of ReIDVis addresses at：https://youtu.be/8FWy6Yr4cos

![avatar](/overview.jpg)



## Function

- The semi-supervised learning method
- The k-fusion post-rank algorithm
- The cluster-based visualization



## Installation

```
# cd to your preferred directory and clone this repo
git clone https://github.com/xiawang157/Video_Object_FeatureVis.git

# create dependencies
cd Video_Object_FeatureVis/
pip install -r requirements.txt
```



## How to use

(1) Install and configure the development environment according to requirement.txt.

(2) Run /Video_Object_FeatureVis/view.py, and start the front-end web service.







