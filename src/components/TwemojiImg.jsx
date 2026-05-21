export default function TwemojiImg({ code, size = 32, style }) {
  return (
    <img
      src={`/twemoji/${code}.svg`}
      width={size}
      height={size}
      alt=""
      draggable={false}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    />
  )
}
