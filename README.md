SF Food Sim
================================================================================
In-browser demo simulation of eating habits and food purchasing decisions in San Francisco under the MIT license as included. See it at https://foodsimsf.com.

<br>

Purpose
--------------------------------------------------------------------------------
This interactive simulation allows players to explore different potential futures to food access in San Francisco using [OpenStreetMap](https://www.openstreetmap.org) data. This simple game estimates an approximate set of "residential" areas and if they would "choose" between either fast food or a grocery store based on proximity and certain behavior variables controllable by the player like how much further a simulated person would be willing to go to get to a grocery store compared to fast food.

<br>

Usage
--------------------------------------------------------------------------------
Available online at https://foodsimsf.com.

<br>

Local Development Environment
--------------------------------------------------------------------------------
Simply run any local HTTP server capable of serving static files in the viz folder. For example, use `python -m http.server` and navigate to http://localhost:8000/.

<br>

Updating the dataset
--------------------------------------------------------------------------------
The data processing pipeline providing source information for the visualization can be run with the following:

```
pip install -r requirements.txt
bash run_pipeline.sh
```

<br>

Deployment
--------------------------------------------------------------------------------
This can be deployed to any static file serving system.

<br>

Development Standards
--------------------------------------------------------------------------------
No automated testing standards enforced by jsdoc encouraged.

<br>

Open Source
--------------------------------------------------------------------------------
Code available under the [MIT license](https://mit-license.org/) (see `LICENSE.md`). Uses the following:

 - [OpenStreetMap data under the ODBL license](https://www.openstreetmap.org)
 - [proj4js under the MIT license](http://proj4js.org/)
 - [PapaParse under the MIT license](https://www.papaparse.com/)
 - [Some StackOverflow used under the CC-BY-SA license](https://stackoverflow.com/help/licensing) ([superliminary](https://stackoverflow.com/questions/2450954), [Nathan Lippi](https://stackoverflow.com/questions/14560999))
 - [ColorBrewer](https://colorbrewer2.org)
 - [Python](https://www.python.org/)
 - [Jupyter under the BSD license](https://jupyter.org/)
 - [Shapely under the BSD license](https://github.com/shapely/shapely)

This SF Food Sim database (`viz/combined.csv`) is made available under the Open Database License: http://opendatacommons.org/licenses/odbl/1.0/. Any rights in individual contents of the database are licensed under the Database Contents License: http://opendatacommons.org/licenses/dbcl/1.0/

<br>

Assets licensing
--------------------------------------------------------------------------------
Note that this project uses the following:

 - [Pixel art portrait generator](https://v-ktor.itch.io/pixel-art-portrait-generator) by [V-ktor](https://v-ktor.itch.io) under the [CC-BY-4.0 License](https://creativecommons.org/licenses/by/4.0/).
 - [Brush Strokes](http://ccmixter.org/files/texasradiofish/64682) by [billraydrums](http://ccmixter.org/people/billraydrums) and [texasradiofish](http://ccmixter.org/people/texasradiofish) under the [CC BY-NC 3.0 License](https://creativecommons.org/licenses/by-nc/3.0/).
 - [Pixel art set of modern various buildings](https://www.dreamstime.com/pixel-art-set-modern-various-buildings-vector-colorful-image171325863) by [Geryjj](https://www.dreamstime.com/greyjj_info). Note that this is a paid license and derivate work may not be able to use it without further licensing.
 - [Pixel Art Style Icons](https://www.dreamstime.com/pixel-art-style-icons-collection-white-background-image192127406) by [Owncham](https://www.dreamstime.com/owncham_info). Note that this is a paid license and derivate work may not be able to use it without further licensing.
