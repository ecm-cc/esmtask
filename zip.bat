:: Dieses Skript erstellt ein .zip-File, das als Lambda-Version bei AWS hochgeladen werden kann (Frontend nicht inkludiert)
jar -cfM lambda.zip modules node_modules views routes *.js
