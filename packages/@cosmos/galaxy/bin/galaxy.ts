#!/usr/bin/env node
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import {
  CosmosStack,
  GalaxyStack,
  TargetSolarSystemStack,
  EcsTargetSolarSystemStack
} from "../lib";

const app = new App();

// The Cosmos
const cosmos = new CosmosStack(app, "Devops", {
  tld: "iagcloud.net"
});

// MGT Account
const mgtGalaxy = new GalaxyStack(cosmos, "Mgt");

const devTargetSolarSystem = new EcsTargetSolarSystemStack(mgtGalaxy, "Dev");

const tstTargetSolarSystem = new EcsTargetSolarSystemStack(mgtGalaxy, "Tst");

// PRD Account
const prdGalaxy = new GalaxyStack(cosmos, "Prd");
// const prdSolarSystem = new SolarSystemStack(prdGalaxy, "PrdSolarSystem");

// google.iag.com -> galaxy x 2

// dev.google.iag.com -> solar system

// prd.google.iag.com -> solar system (different account?)
