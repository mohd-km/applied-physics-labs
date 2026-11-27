import type { Story } from '../../shell/Shell';

// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'Dozens of drugs have made animals live longer, but only a few could ever work as a pill in people. This lab helps you pick which ones are worth testing first.',
  how:
    'It holds 28 compounds already studied for ageing, with their real measured properties copied from public databases: size, greasiness, strength on their target, and how much extra lifespan they gave lab animals. Four sliders say how much you care about each quality, and every molecule is re-scored out of 100 using published rules of thumb, not a trained model. Nothing is predicted or invented.',
  tryThis:
    'On Rank and compare, press "Brain first". Dasatinib drops off the top and 17-alpha-Estradiol takes first place, because that preset rewards molecules small and greasy enough to cross into the brain.',
};

export default story;
