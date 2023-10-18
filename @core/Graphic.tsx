import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { Position } from "./GameObject";
import useAsset from "./useAsset";
import useGameLoop from "./useGameLoop";
import { useLoader } from "@react-three/fiber";

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

// create geometry once and reuse
const geometry = new THREE.PlaneGeometry(1, 1);

export default memo(
  /* eslint-disable react/prop-types */
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

    const image = useAsset(src) as HTMLImageElement;
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
      const textureOffsetX = (currentFrame * frameWidth) / image.width;
      const textureOffsetY = (firstFrame[1] * frameHeight) / image.height;
      textureRef.current.offset.setX(textureOffsetX);
      textureRef.current.offset.setY(textureOffsetY);
    }, [firstFrame, frameHeight, frameWidth, image, textureRef]);

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
        x: image.width / frameWidth,
        y: image.height / frameHeight,
      };
      return {
        image,
        repeat: new THREE.Vector2(1 / size.x, 1 / size.y),
        magFilter,
        minFilter: THREE.LinearMipMapLinearFilter,
      };
    }, [frameHeight, frameWidth, image, magFilter]);

    useLayoutEffect(() => {
      textureRef.current = texture;
      textureRef.current.image = textureProps.image;
      textureRef.current.repeat = textureProps.repeat;
      textureRef.current.minFilter = THREE.LinearMipMapLinearFilter;
      textureRef.current.magFilter = magFilter as any;
    }, []);

    return (
      <mesh
        ref={outerRef}
        position={[offset.x, offset.y, -offset.y / 100]}
        scale={[flipX * scale, scale, 1]}
        geometry={geometry}
      >
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
      </mesh>
    );
  })
);
