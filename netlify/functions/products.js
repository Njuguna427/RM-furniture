const { sb, json } = require('../lib/shared');

exports.handler = async () => {
  try {
    const [products, zones] = await Promise.all([
      sb('products?is_active=eq.true&order=id.asc&select=id,name,category,price,color,style,rating,tag,image_url,description,dimensions,material,stock'),
      sb('delivery_zones?order=fee.asc&select=name,fee'),
    ]);
    return json(200, { products, zones });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not load products.' });
  }
};
