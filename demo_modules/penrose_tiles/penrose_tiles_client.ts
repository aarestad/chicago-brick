import { Client } from "../../client/modules/module_interface.ts";
import { ModuleWS } from "../../lib/websocket.ts";
import { Polygon } from "../../lib/math/polygon2d.ts";
import { CanvasSurface } from "../../client/surface/canvas_surface.ts";
import { ModulePeer } from "../../client/network/peer.ts";
import { Rectangle } from "../../lib/math/rectangle.ts";
import {
  CurrentValueInterpolator,
  ModuleState,
  NumberLerpInterpolator,
  SharedState,
} from "../../client/network/state_manager.ts";
import { P2TileType, PenroseTilesState, TileGenerations } from "./tile.ts";

export function load(
  network: ModuleWS,
  peerNetwork: ModulePeer,
  state: ModuleState,
  wallGeometry: Polygon,
) {
  class PenroseTilesClient extends Client {
    ctx!: CanvasRenderingContext2D;
    tilesState?: SharedState;
    tileGenerations?: TileGenerations;

    // Notification that your module has been selected next in the queue.
    willBeShownSoon(
      container: HTMLElement,
      _deadline: number,
    ): Promise<void> | void {
      this.surface = new CanvasSurface(container, wallGeometry);
      this.ctx = (this.surface as CanvasSurface).context;

      this.tilesState = state.define("tiles", {
        currentGeneration: CurrentValueInterpolator,
        tileGenerations: [[
          {
            points: CurrentValueInterpolator,
            angle: CurrentValueInterpolator,
            size: CurrentValueInterpolator,
            type: CurrentValueInterpolator,
            extents: CurrentValueInterpolator,
          },
        ]],
        kiteHue: NumberLerpInterpolator,
        dartHue: NumberLerpInterpolator,
      });
    }

    // Notification that your module has started to fade in.
    beginFadeIn(_time: number) {}

    // Notification that your module has finished fading in.
    finishFadeIn() {}

    // Notification that your module should now draw.
    draw(time: number, _delta: number) {
      if (!this.tileGenerations) {
        this.tileGenerations = (this.tilesState?.get(0) as PenroseTilesState)
          ?.tileGenerations;

        if (!this.tileGenerations) {
          return;
        }

        // Filter out tiles that aren't visible on this screen
        // for (let i = 0; i < this.tileGenerations.length; ++i) {
        //   this.tileGenerations[i] = this.tileGenerations[i].filter(st => {
        //     if (this.surface) {
        //       return Tile.deserialize(st).extents.intersects(this.surface.virtualRect);
        //     }

        //     return false;
        //   });
        // }
      }

      if (!this.surface) {
        return;
      }

      (this.surface as CanvasSurface).pushOffset();

      const state = this.tilesState?.get(time) as PenroseTilesState;

      if (!state) {
        return;
      }

      for (const tile of this.tileGenerations[state.currentGeneration]) {
        if (
          !Rectangle.deserialize(tile.extents)?.intersects(
            this.surface.virtualRect,
          )
        ) {
          continue;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(tile.points[0].x, tile.points[0].y);

        for (const p of tile.points.slice(1)) {
          this.ctx.lineTo(p.x, p.y);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // hard-code saturation at 100% and lightness at 50% for now
        this.ctx.fillStyle = `hsl(${
          tile.type == P2TileType.Kite ? state.kiteHue : state.dartHue
        }turn 100% 50%)`;

        this.ctx.fill();
      }

      (this.surface as CanvasSurface).popOffset();
    }

    // Notification that your module has started to fade out.
    beginFadeOut() {}

    // Notification that your module has finished fading out.
    finishFadeOut() {
      if (this.surface) {
        this.surface.destroy();
      }
    }
  }

  return { client: PenroseTilesClient };
}
