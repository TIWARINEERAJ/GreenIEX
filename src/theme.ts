import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      solar: '#FFB800',
      wind: '#00B4D8',
      hydro: '#0077BE',
      green: '#2F855A'
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      }
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'green',
      },
    },
  },
});

export default theme;
