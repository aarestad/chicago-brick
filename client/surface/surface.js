/* Copyright 2018 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Rectangle} from '/lib/lame_es6/rectangle.js';
import * as geometry from '/lib/lame_es6/geometry.js';
import * as info from '/client/util/info.es6.js';

// Installs a surface in the given container & readies the surface for
// drawing.
export class Surface {
  constructor(container, wallGeometry) {
    this.container = container;

    this.wallGeometry = wallGeometry;
    this.wallRect = wallGeometry.extents;
    this.globalVirtualRect = new Rectangle(
        info.virtualRect.x, info.virtualRect.y,
        info.virtualRect.w, info.virtualRect.h);
    // This client information is in the space of the whole wall, but we've
    // potentially received a more local wall layout to play in. As a result, we
    // need to adjust our virtual rect to match our local wall section.
    this.virtualRect = new Rectangle(
        this.globalVirtualRect.x - this.wallRect.x,
        this.globalVirtualRect.y - this.wallRect.y,
        this.globalVirtualRect.w, this.globalVirtualRect.h);
    this.virtualRectNoBezel = new Rectangle(
        info.virtualRectNoBezel.x, info.virtualRectNoBezel.y,
        info.virtualRectNoBezel.w, info.virtualRectNoBezel.h);
    this.virtualOffset = new Rectangle(
        info.virtualOffset.x, info.virtualOffset.y,
        this.wallRect.w / info.virtualRectNoBezel.w,
        this.wallRect.h / info.virtualRectNoBezel.h);
  }
  isVisible(x, y) {
    return geometry.isInside(this.wallGeometry, x, y);
  }
  isOffsetVisible(x, y) {
    return this.isVisible((x+0.5) * this.virtualRect.w,
                          (y+0.5) * this.virtualRect.h);
  }
  isOffsetWithinExtents(x, y) {
    x = (x+0.5) * this.virtualRect.w;
    y = (y+0.5) * this.virtualRect.h;
    return geometry.isInsideRect(this.wallRect, x, y);
  }
  wallExtentLineTest(ax, ay, bx, by) {
    return geometry.intersectPolygonLine(this.wallGeometry, ax, ay, bx, by);
  }
  // Destroys a surface.
  destroy() {}
  // Returns the visible rect of the surface, anchored at 0,0
  getRect() {}
}
