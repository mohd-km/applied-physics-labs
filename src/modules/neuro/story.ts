import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'How does a single brain cell decide to fire, and why does the brain\'s dopamine signal track surprise rather than pleasure itself? A better-than-expected reward makes dopamine cells burst, an expected one barely moves them, and a missing one makes them go quiet.',
  how:
    'Lab 1 uses the Leaky Integrate-and-Fire model (LIF — a standard mathematical model of a single neuron): input current fills the cell like water in a leaky bucket, and once the voltage crosses a threshold it fires an action potential (an all-or-nothing electrical spike) and resets. Lab 2 computes the Reward Prediction Error (RPE — the gap between expected and actual reward) and draws the dopamine response, and shows how repeating the same strong reward for days lowers the resting dopamine level (tolerance).',
  tryThis:
    'In Lab 1, click "Sub-threshold — no spike", then drag "Input current" slowly to the right: just past 200 pA the voltage crosses the dashed threshold line and the first spike appears.',
};
export default story;
