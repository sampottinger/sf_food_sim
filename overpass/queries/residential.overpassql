/* SF residential areas */
[out:csv(::type,::id,::lat,::lon;true;",")];
(
  way["highway"="residential"](37.7083,-122.5206,37.8128,-122.3544);
  >;
);
out body;
