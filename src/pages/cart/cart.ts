import { ref, onMounted, defineAsyncComponent } from 'vue';
import { computed } from '@vue/runtime-core';
import { cartStore } from '../../store/cart';
import alertBulma, { alertConfirmationBulma } from '../../core/global/alert';
import { useRouter } from 'vue-router';
import { utilitiesStore } from '../../store/utilities';
import { useStore } from 'vuex';
import { removeClassValidation } from '../../core/global/validation';

export default {
  name: 'Cart',
  components: {
    SpinnerComponent: defineAsyncComponent(() =>
      import('@/components/spinner/spinner.component.vue')
    ),
    Products: defineAsyncComponent(() =>
      import('@/pages/check-out/products/products.vue')
    ),
    Modal: defineAsyncComponent(() => import('@/pages/cart/modal/modal.vue')),
    ModalProducts: defineAsyncComponent(() =>
      import('@/components/modal-products/modal-products.vue')
    ),
  },
  setup() {
    const infoPrice = ref([
      {
        name: 'Subtotal',
      },
      {
        name: 'IVA',
      },
      {
        name: 'Total',
      },
      {
        name: 'TotalUSD',
      },
      {
        name: 'Productos',
      },
      {
        name: 'Items',
      },
    ]);

    const authStore = useStore();

    const router = useRouter();

    const isActive = ref(true);
    const isModal = ref(false);

    const infoCart = ref(['', 'Cantidad', 'Precio', 'Variación']);

    onMounted(async () => {
      uploadProducts();
    });

    const uploadProducts = async () => {
      if (authStore.getters.isAuth) {
        await cartStore
          .dispatch('getCartApi')
          .catch((error: any) => {
            console.log(error);
            alertBulma(
              'warning',
              'Error',
              'No pudimos cargar la lista de artículos del carrito, por favor recarga la página',
              { label: 'Entendido' }
            );
          })
          .finally(() => {
            isActive.value = false;
          });
      } else {
        cartStore.dispatch('getCartLocal');
        isActive.value = false;
      }

      cartStore.dispatch('values');
    };

    const products = computed(() => {
      return cartStore.state.products;
    });

    const iva = computed(() => {
      return cartStore.state.iva;
    });

    const totalusd = computed(() => {
      return cartStore.state.subtotal;
    });

    const productos = ref(0);
    const items = ref(0);
    const item = ref(0);

    const subtotal = computed(() => {
      return cartStore.state.subtotal;
    });

    const total = computed(() => {
      calcTotalProduct();
      return cartStore.state.total;
    });

    const textProuct = (row: any, index: number) => {
      switch (index) {
        case 0:
          return row.product.name;
        case 1:
          return row.quantity;
        case 2:
          return row.variation.price;
        case 3:
          return row.variation.size;
      }
    };

    const pay = () => {
      const generar = generateWhatsappText(products.value, subtotal.value);
      if (authStore.getters.isAuth) {
        if (authStore.state.auth.people.phone) {
          utilitiesStore.commit('setActiveMenu', 'cart');
          router.push('/shopping-cart/payment');
        } else {
          isModal.value = true;
        }
      } else {
        alertConfirmationBulma(
          'warning',
          'Sin autenticar',
          'Inicia sesión o realiza la compra en incognito',
          () => {
            for (let product of products.value) {
              cartStore
                .dispatch('deleteCartLocal', product.product_id)
                .catch((res: any) => {
                  console.log(res);
                });
            }
            window.location.replace(
              'https://api.whatsapp.com/send/?phone=%2B584149549050&text=' +
                generar
            );
          },
          () => {
            router.push('/auth/sign-in');
          },
          'Comprar en incognito',
          'Iniciar Sesión'
        );
      }
    };

    const calcTotalProduct = () => {
      productos.value = 0;
      items.value = products.value.length;
      for (const row of products.value) {
        productos.value += row.quantity;
      }
    };

    const dismissForm = () => {
      isModal.value = false;
    };

    const getData = (data: any) => {
      console.log('recibiendo datos en carts', data);
      item.value = data;
    };

    const updateQuantity = (data: boolean) => {
      uploadProducts();
    };

    const generateWhatsappText = (req: any, subtotal: any) => {
      const data = req;
      let text = '';
      if (data) {
        for (let product of data) {
          text =
            text +
            `%0A%2A${product.quantity}+x+${product.product.name}%2A+$${product.variation.price}.00+Cada+Uno/a`;
        }
        text = text + `%0A%0ATotal:+%2A$${subtotal}.00%2A%0A`;
      }
      return text;
    };

    return {
      infoPrice,
      products,
      infoCart,
      textProuct,
      subtotal,
      iva,
      total,
      pay,
      updateQuantity,
      isActive,
      productos,
      calcTotalProduct,
      items,
      item,
      getData,
      isModal,
      dismissForm,
      totalusd,
    };
  },
};
