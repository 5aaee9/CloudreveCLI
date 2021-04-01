{
    stdenv, fetchFromGitHub, nodejs-12_x, yarn,
    makeWrapper, mkYarnModules, pkgs
}:

stdenv.mkDerivation rec {
    pname = "cloudreve-cli";
    version = "0.0.2";

    nodeModules = mkYarnModules {
        name = "${pname}-node-modules-${version}";
        inherit pname version;
        # it is vitally important the the package.json has name and version fields
        packageJSON = ./package.json;
        yarnLock = ./yarn.lock;
    };

    nativeBuildInputs = [ makeWrapper ];
    buildInputs = [ nodejs-12_x yarn ];

    src = ./.;

    meta.description = "CLI for Cloudreve";

    buildPhase = ''
        ln -s ${nodeModules}/node_modules .
        yarn run --offline build
    '';

    installPhase = ''
        mkdir -p $out/bin/
        cp -r build $out/src
        cp package.json $out/
        cp -r ${nodeModules}/node_modules $out/
        makeWrapper "${nodejs-12_x}/bin/node" "$out/bin/cloudreve-cli" \
            --add-flags "$out/src/default.js"
    '';
}
