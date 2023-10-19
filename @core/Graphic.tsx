import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Position } from "./GameObject";
import useGameLoop from "./useGameLoop";
import { useLoader } from "@react-three/fiber";
import HtmlOverlay from "./HtmlOverlay";

export interface GraphicProps {
  src: string;
  sheet?: {
    [index: string]: number[][];
  };
  state?: string;
  frameWidth?: number;
  frameHeight?: number;
  frameTime?: number;
  scale?: number;
  flipX?: number;
  color?: string;
  opacity?: number;
  offset?: Position;
  basic?: boolean;
  blending?: THREE.Blending;
  magFilter?: THREE.TextureFilter;
  onIteration?: () => void;
}

export default memo(
  forwardRef<THREE.Mesh, GraphicProps>(function Graphic(
    {
      src,
      sheet = {
        default: [[0, 0]],
      },
      state = "default",
      frameWidth = 16,
      frameHeight = 16,
      frameTime = 200,
      scale = 1,
      flipX = 1,
      color = "#fff",
      opacity = 1,
      offset = { x: 0, y: 0 },
      basic,
      blending = THREE.NormalBlending,
      magFilter = THREE.NearestFilter,
      onIteration,
    }: GraphicProps,
    outerRef
  ) {
    if (!sheet[state]) {
      // eslint-disable-next-line no-console
      console.warn(
        `Sprite state '${state}' does not exist in sheet '${src}':`,
        Object.keys(sheet)
      );
    }

    const [frameState, setFrameState] = useState<any>();

    const texture = useLoader(THREE.TextureLoader, src);
    const textureRef = useRef<THREE.Texture>(null!);

    const mounted = useRef(true);
    const interval = useRef<number>();
    const prevFrame = useRef<number>(-1);
    const frame = useRef(0);
    const frames = sheet[state];
    const [firstFrame, lastFrame = firstFrame] = frames;
    const frameLength = lastFrame[0] + 1 - firstFrame[0];

    const handleFrameUpdate = useCallback(() => {
      const currentFrame = firstFrame[0] + frame.current;
      const textureOffsetX =
        (currentFrame * frameWidth) / textureRef.current.image.width;
      const textureOffsetY =
        (firstFrame[1] * frameHeight) / textureRef.current.image.height;
      textureRef.current.offset.setX(textureOffsetX);
      textureRef.current.offset.setY(textureOffsetY);
      setFrameState({
        state,
        textureOffsetX,
        textureOffsetY,
      });
      console.log("setFrameState", state, currentFrame);
    }, [firstFrame, frameHeight, frameWidth, textureRef.current, frame, state]);

    // initial frame update
    useEffect(() => handleFrameUpdate(), [handleFrameUpdate]);

    useGameLoop((time) => {
      if (!mounted.current) return;
      if (interval.current == null) interval.current = time;

      if (time >= interval.current + frameTime) {
        interval.current = time;
        prevFrame.current = frame.current;
        frame.current = (frame.current + 1) % frameLength;

        handleFrameUpdate();

        if (prevFrame.current > 0 && frame.current === 0) {
          onIteration?.();
        }
      }
    }, frameLength > 1);

    const iterationCallback = useRef<typeof onIteration>();
    iterationCallback.current = onIteration;
    // call onIteration on cleanup
    useEffect(
      () => () => {
        mounted.current = false;
        iterationCallback.current?.();
      },
      []
    );

    const materialProps = useMemo<
      Partial<THREE.MeshBasicMaterial & THREE.MeshLambertMaterial>
    >(
      () => ({
        color: new THREE.Color(color),
        opacity,
        blending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        fog: false,
        flatShading: true,
        precision: "lowp",
      }),
      [opacity, blending, color]
    );

    const textureProps = useMemo(() => {
      const size = {
        x: texture.image.width / frameWidth,
        y: texture.image.height / frameHeight,
      };
      return {
        repeat: new THREE.Vector2(1 / size.x, 1 / size.y),
        magFilter,
        minFilter: THREE.LinearMipMapLinearFilter,
      };
    }, []);

    useLayoutEffect(() => {
      textureRef.current = texture;
      textureRef.current.repeat = textureProps.repeat;
      textureRef.current.minFilter = textureProps.minFilter;
      textureRef.current.magFilter = magFilter as any;
      const currentFrame = firstFrame[0] + frame.current;
      const textureOffsetX =
        (currentFrame * frameWidth) / textureRef.current.image.width;
      const textureOffsetY =
        (firstFrame[1] * frameHeight) / textureRef.current.image.height;
      textureRef.current.offset.setX(textureOffsetX);
      textureRef.current.offset.setY(textureOffsetY);
    }, [textureProps]);

    //console.log("render");

    // return (
    //   <group>
    //     <HtmlOverlay>
    //       <div style={{ fontSize: "6px" }}>
    //         {frameState ? frameState.state : ""}
    //       </div>
    //       <div style={{ fontSize: "6px" }}>
    //         {frameState ? frameState.textureOffsetX : ""}
    //       </div>
    //       <div style={{ fontSize: "6px" }}>
    //         {frameState ? frameState.textureOffsetY : ""}
    //       </div>
    //     </HtmlOverlay>
    //   </group>
    // );

    return (
      <mesh
        ref={outerRef}
        position={[offset.x, offset.y, -offset.y / 100]}
        scale={[flipX * scale, scale, 1]}
      >
        <planeGeometry attach="geometry" />
        {basic ? (
          <meshBasicMaterial
            attach="material"
            map={texture}
            {...materialProps}
          />
        ) : (
          <meshLambertMaterial
            attach="material"
            map={texture}
            {...materialProps}
          />
        )}
        <group>
          <HtmlOverlay>
            <div style={{ fontSize: "6px" }}>
              {frameState ? frameState.state : ""}
            </div>
            <div style={{ fontSize: "6px" }}>
              {frameState ? frameState.textureOffsetX : ""}
            </div>
            <div style={{ fontSize: "6px" }}>
              {frameState ? frameState.textureOffsetY : ""}
            </div>
          </HtmlOverlay>
        </group>
      </mesh>
    );
  })
);
