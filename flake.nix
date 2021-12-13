{
  description = "CLI for cloudreve";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };

    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ]
      (system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };

          cloudreve-cli = with pkgs; let
            pname = "cloudreve-cli";
            version = "0.0.3";
            nodeModules = mkYarnModules {
              name = "${pname}-node-modules-${version}";
              inherit pname version;
              # it is vitally important the the package.json has name and version fields
              packageJSON = ./package.json;
              yarnLock = ./yarn.lock;
            };
          in
          stdenv.mkDerivation {
            inherit pname version;

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
          };

          fetch-cloudreve = with pkgs; { share ? "", shareFile ? "", sha256 ? "" }: stdenv.mkDerivation {
            name = "cloudreve-share-${shareFile}";
            builder = writeScript "${shareFile}-builder.sh" ''
              set -o noglob

              mkdir download
              cd download

              cloudreve-cli share:download $share /$shareFile

              fl=$(basename $shareFile)
              unpackFile $fl
              rm -f $fl
              ls -lah
              mv $(pwd) $out
              runHook postFetch
              set +o noglob
            '';

            nativeBuildInputs = [ cloudreve-cli ];
            outputHashAlgo = "sha256";
            outputHash = sha256;
            outputHashMode = "recursive";

            inherit share shareFile;
          };
          packages = {
            inherit cloudreve-cli fetch-cloudreve;
          };
        in
        {
          inherit packages;
          legacyPackages = packages;
          defaultPackage = cloudreve-cli;
          overlay = final: prev: packages;
        });
}
