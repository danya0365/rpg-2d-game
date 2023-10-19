import React, {
  Dispatch,
  SetStateAction,
  useState,
  RefObject,
  useRef,
  useMemo,
} from "react";
import { Position } from "./GameObject";
import Graphic, { GraphicProps } from "./Graphic";
import useComponentRegistry, { ComponentRef } from "./useComponentRegistry";
import HtmlOverlay from "./HtmlOverlay";

export type SpriteRef = ComponentRef<
  "Sprite",
  {
    setColor: Dispatch<SetStateAction<string | undefined>>;
    setOpacity: Dispatch<SetStateAction<number | undefined>>;
    setState: Dispatch<SetStateAction<string>>;
    setFlipX: Dispatch<SetStateAction<number | undefined>>;
    setScale: Dispatch<SetStateAction<number | undefined>>;
    setOffset: Dispatch<SetStateAction<Position | undefined>>;
    flipX: number | undefined;
    nodeRef: RefObject<THREE.Object3D>;
  }
>;

export type SpriteProps = GraphicProps;

export default function Sprite({
  sheet,
  state: initialState = "default",
  flipX: initialFlipX,
  color: initialColor,
  opacity: initialOpacity,
  offset: initialOffset,
  scale: initialScale,
  ...graphicProps
}: SpriteProps) {
  const [color, setColor] = useState(initialColor);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [flipX, setFlipX] = useState(initialFlipX);
  const [state, setState] = useState(initialState);
  const [offset, setOffset] = useState(initialOffset);
  const [scale, setScale] = useState(initialScale);
  const nodeRef = useRef<THREE.Mesh>(null!);

  useComponentRegistry<SpriteRef>("Sprite", {
    setColor,
    setOpacity,
    setState,
    setOffset,
    setScale,
    setFlipX,
    flipX,
    nodeRef,
  });

  const stateFrames = useMemo(() => {
    const frames = sheet ? sheet[state] : [];
    return {
      state,
      frames,
    };
  }, [sheet, state]);

  // return (
  //   <group>
  //     <HtmlOverlay>
  //       <div style={{ fontSize: "6px" }}>{stateFrames["state"]}</div>
  //       <div style={{ fontSize: "6px" }}>{stateFrames["frames"]}</div>
  //     </HtmlOverlay>
  //   </group>
  // );

  return (
      <Graphic
        ref={nodeRef}
        sheet={sheet}
        state={state}
        flipX={flipX}
        color={color}
        opacity={opacity}
        offset={offset}
        scale={scale}
        {...graphicProps}
      />
  );
}
