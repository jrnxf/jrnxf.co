import { useEffect } from "react";

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+10.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 uvA = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  float warp1 = fbm(vec3(uvA * 1.0, t * 0.02));
  float warp2 = fbm(vec3(uvA * 0.8 + warp1 * 0.4 + 3.0, t * 0.015));
  float field = fbm(vec3(uvA * 1.2 + warp2 * 0.35, t * 0.018));

  float intensity = field * 0.5 + 0.5;
  intensity = smoothstep(0.2, 0.8, intensity);
  intensity *= 0.30;

  float g1 = hash(gl_FragCoord.xy + fract(t * 0.6) * 1000.0);
  float g2 = hash(gl_FragCoord.xy * 1.7 + fract(t * 0.9) * 500.0);
  float g3 = hash(gl_FragCoord.xy * 0.5 + fract(t * 1.2) * 800.0);
  float grain = mix(mix(g1, g2, 0.5), g3, 0.3);
  grain = (grain - 0.5) * 0.16;

  float v = clamp(intensity + grain, 0.0, 1.0);
  fragColor = vec4(vec3(v), 1.0);
}
`;

// Inline script that runs synchronously before React hydrates.
// It boots the WebGL shader on the #dither-bg canvas so the first frame
// is painted before any JS bundles finish loading.
export const SHADER_BOOT_SCRIPT = `(function(){
var c=document.getElementById('dither-bg');
if(!c)return;
var gl=c.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
if(!gl)return;
var VS=${JSON.stringify(VERTEX)};
var FS=${JSON.stringify(FRAGMENT)};
function mk(t,s){var sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;}
var vs=mk(gl.VERTEX_SHADER,VS),fs=mk(gl.FRAGMENT_SHADER,FS);
var pg=gl.createProgram();gl.attachShader(pg,vs);gl.attachShader(pg,fs);gl.linkProgram(pg);
if(!gl.getProgramParameter(pg,gl.LINK_STATUS))return;
gl.useProgram(pg);
var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
var pos=gl.getAttribLocation(pg,'position');gl.enableVertexAttribArray(pos);
gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
var uT=gl.getUniformLocation(pg,'uTime'),uR=gl.getUniformLocation(pg,'uResolution');
var D=Math.min(window.devicePixelRatio||1,1);
var w=window.innerWidth,h=window.innerHeight;
c.width=Math.round(w*D);c.height=Math.round(h*D);
gl.viewport(0,0,c.width,c.height);
gl.uniform1f(uT,0);gl.uniform2f(uR,c.width,c.height);
gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
var start=performance.now();
var id=0;
function loop(){id=requestAnimationFrame(loop);var e=(performance.now()-start)/1000;
gl.uniform1f(uT,e);gl.uniform2f(uR,c.width,c.height);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
loop();
function resize(){w=window.innerWidth;h=window.innerHeight;
c.width=Math.round(w*D);c.height=Math.round(h*D);
c.style.width=w+'px';c.style.height=h+'px';
gl.viewport(0,0,c.width,c.height);}
window.addEventListener('resize',resize);
window.__ditherCleanup=function(){cancelAnimationFrame(id);window.removeEventListener('resize',resize);
gl.deleteProgram(pg);gl.deleteShader(vs);gl.deleteShader(fs);gl.deleteBuffer(buf);};
})()`;

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderBackground() {
  useEffect(() => {
    // The inline boot script already started the animation loop.
    // If for some reason it didn't run (e.g. SSR-only), boot it here as fallback.
    const canvas = document.getElementById("dither-bg") as HTMLCanvasElement | null;
    if (!canvas) return;

    // Check if the boot script already initialized WebGL
    const existingGl = canvas.getContext("webgl2");
    if (existingGl && (window as any).__ditherCleanup) {
      // Boot script is running, nothing to do
      return () => {
        (window as any).__ditherCleanup?.();
      };
    }

    // Fallback: initialize from scratch
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");

    const DPR = Math.min(window.devicePixelRatio ?? 1, 1);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    let animId = 0;
    const start = performance.now();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  // Canvas is rendered in __root.tsx, not here
  return null;
}
