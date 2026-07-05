import React from "react";
import type { BalanceGameId } from "../../balance";
import { TreeTimer } from "./TreeTimer";
import { NightTree } from "./NightTree";
import { SockMission } from "./SockMission";
import { StarfishHold } from "./StarfishHold";
import { GrowingTree } from "./GrowingTree";

export function BalanceGameScreen({
  id,
  onBack,
}: {
  id: BalanceGameId;
  onBack: () => void;
}) {
  switch (id) {
    case "tree-timer":
      return <TreeTimer onBack={onBack} />;
    case "night-tree":
      return <NightTree onBack={onBack} />;
    case "sock-mission":
      return <SockMission onBack={onBack} />;
    case "standing-starfish":
      return <StarfishHold onBack={onBack} />;
    case "growing-tree":
      return <GrowingTree onBack={onBack} />;
  }
}
