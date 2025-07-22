import {
  Shape,
  ArrowStraightShape,
  ArrowElbowShape,
  ArrowCurveShape,
} from "@/types/canvas";

export const isAnyArrowShape = (
  shape: Shape
): shape is ArrowStraightShape | ArrowElbowShape | ArrowCurveShape => {
  return (
    shape.type === "arrow-straight" ||
    shape.type === "arrow-elbow" ||
    shape.type === "arrow-curve"
  );
};
