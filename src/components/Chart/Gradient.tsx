import * as React from 'react';

export type TBound = { bound: number, hue: number; saturation: number; lightness: number };

const RenderFloatInput = (props: { value: number, onChange: (value: number) => void }) => (
  <input
    type="number"
    value={props.value}
    onChange={(evt) => props.onChange(parseFloat(evt.target.value || '0'))}
  />
);

export const Gradient = (props: { bounds: TBound[]; onChange: (bounds: TBound[]) => void }) => (
  <table style={{ width: '100%' }} cellSpacing={0} cellPadding={0}>
    <tbody>
      {props.bounds.map((b, idx) => {
        const changeItem = (value: Partial<TBound>) => {
          props.onChange(
            [
              ...props.bounds.slice(0, idx),
              { ...b, ...value },
              ...props.bounds.slice(idx + 1)
            ]
          );
        };
        const addItem = () => props.onChange(
          [
            ...props.bounds.slice(0, idx + 1),
            { ...b, bound: b.bound - 1 },
            ...props.bounds.slice(idx + 1)
          ]
        );
        const removeItem = () => props.onChange(
          [
            ...props.bounds.slice(0, idx),
            ...props.bounds.slice(idx + 1)
          ]
        );

        return (
          <tr key={idx} style={{ backgroundColor: `hsla(${b.hue}, ${b.saturation}%, ${b.lightness}%, 0.6)` }}>
            <td><RenderFloatInput value={b.bound} onChange={(value) => changeItem({ bound: value })} /></td>
            <td><RenderFloatInput value={b.hue} onChange={(value) => changeItem({ hue: value })} /></td>
            <td><RenderFloatInput value={b.saturation} onChange={(value) => changeItem({ saturation: value })} /></td>
            <td><RenderFloatInput value={b.lightness} onChange={(value) => changeItem({ lightness: value })} /></td>
            <td onClick={addItem}>Insert below</td>
            <td onClick={removeItem}>Remove</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);