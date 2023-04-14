const models = ['basicEarth', 'starlightEarth'];
const defaultModel = models[1];

const mount = async (model) => {
  const container = document.querySelector('#container');
  container.innerHTML = '';
  const module = await import('./' + model);
  module.default();
};

window.addEventListener('load', () => {
  const app = document.querySelector('#app');

  const container = document.createElement('div');
  container.id = 'container';

  app.appendChild(container);

  models.forEach((model, idx) => {
    const button = document.createElement('button');
    button.innerHTML = model;
    button.style = `
      position: absolute;
      top: ${idx * 21}px;
      left: 0;
      background: transparent;
      border: 0;
      color: skyblue;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.5;
    `;
    button.onclick = () => mount(model);
    app.appendChild(button);
  });

  mount(defaultModel);
});
