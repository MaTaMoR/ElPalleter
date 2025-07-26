import cartaData from '../data/carta-data.json';

export class CartaService {

    static getCategories() {
        return cartaData.categories;
    }

    static getCartaData() {
        return cartaData;
    }
}

export default CartaService;