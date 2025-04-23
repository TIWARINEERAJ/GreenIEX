import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  useColorModeValue,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
} from '@chakra-ui/react';
import { SunIcon, WindIcon, DropIcon } from './Icons';
import { useAuth } from '../../features/auth/AuthContext';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Box>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              GreenIEX
            </Text>
          </Box>
          <HStack as="nav" spacing={4}>
            <Link as={RouterLink} to="/" px={2} py={1} rounded="md">
              Dashboard
            </Link>
            <Link as={RouterLink} to="/trading" px={2} py={1} rounded="md">
              Trading
            </Link>
            <Link as={RouterLink} to="/rec-market" px={2} py={1} rounded="md">
              REC Market
            </Link>
            <Link as={RouterLink} to="/carbon-impact" px={2} py={1} rounded="md">
              Carbon Impact
            </Link>
          </HStack>
        </HStack>
        <HStack>
          <IconButton
            aria-label="Solar Energy"
            icon={<SunIcon />}
            variant="ghost"
            colorScheme="yellow"
          />
          <IconButton
            aria-label="Wind Energy"
            icon={<WindIcon />}
            variant="ghost"
            colorScheme="blue"
          />
          <IconButton
            aria-label="Hydro Energy"
            icon={<DropIcon />}
            variant="ghost"
            colorScheme="cyan"
          />
          
          {isAuthenticated ? (
            <Menu>
              <MenuButton>
                <HStack>
                  <Avatar size="sm" name={user?.username} bg="green.500" />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {user?.username}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem>Profile</MenuItem>
                <MenuItem>Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="green"
              variant="outline"
              size="sm"
            >
              Login
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navigation;
