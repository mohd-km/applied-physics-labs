import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'Can a cheap 4-sensor headband tell if you are focused? This lab reads simulated brainwaves (EEG, the faint electrical buzz of the brain) and turns them into a live focus score.',
  how:
    'An FFT splits each wave into its rhythms: slow delta and theta, calm alpha (8-13 Hz), busy beta (13-30 Hz). More fast rhythm than slow reads as focus. Filters strip out blinks and mains hum first, and a second view shows how often the detector would be right.',
  tryThis:
    'Click "Hum remover (50 Hz notch)" and watch the tall spike at 50 Hz in the power spectrum chart drop sharply.',
};
export default story;
