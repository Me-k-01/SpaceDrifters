/* Operation sur les listes de points de polygones*/

const getSide = (a, b) => {
  const x = a.x*b.y-a.y*b.x;
  if (x < 0)
    return "LEFT";
  if (x > 0)
    return "RIGHT";
};

const pointInsidePoly = (point, vertices) => {
  // Test si un point donné est à l'intérieur d'un polygone.
  let prevSide;
  const vertNum = vertices.length;
  for (let i=0; i<vertNum; i++) {
    let a = vertices[i],
      b = vertices[(i+1)%vertNum];

    affineSegment = Vector.subVec(a, b);
    affinePoint = Vector.subVec(point, a);
    currentSide = getSide(affineSegment, affinePoint);
    if (! currentSide)
      return false; //outside or over an edge
    if (! prevSide) //first segment
      prevSide = currentSide;
    else if (prevSide != currentSide)
      return false;
  }
  return true;
};