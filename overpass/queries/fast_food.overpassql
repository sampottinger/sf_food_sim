/* SF fast food with names */
[out:csv(::type,::id,name,shop,brand,hours,::lat,::lon)];
(
  node["amenity"="fast_food"]["name"!=""](37.7083,-122.5206,37.8128,-122.3544);
);
out body;
