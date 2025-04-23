import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { RECertificate } from '../../types/market';

const RECMarket: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [certificates, setCertificates] = useState<RECertificate[]>([]);
  const [selectedREC, setSelectedREC] = useState<RECertificate | null>(null);
  const [transferForm, setTransferForm] = useState({
    newOwnerId: '',
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rec/available');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      toast({
        title: 'Error fetching certificates',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleTransfer = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rec/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recId: selectedREC?.id,
          newOwnerId: transferForm.newOwnerId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Certificate transferred successfully',
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchCertificates();
      } else {
        throw new Error('Failed to transfer certificate');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Error transferring certificate',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const openTransferModal = (rec: RECertificate) => {
    setSelectedREC(rec);
    onOpen();
  };

  return (
    <Box>
      <Grid templateColumns="1fr" gap={8}>
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Heading size="md" mb={6}>REC Certificates</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Energy Type</Th>
                <Th>Quantity (MWh)</Th>
                <Th>Generation Date</Th>
                <Th>Carbon Offset</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {certificates.map((cert) => (
                <Tr key={cert.id}>
                  <Td>{cert.id.substring(0, 8)}...</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        cert.energyType === 'SOLAR'
                          ? 'yellow'
                          : cert.energyType === 'WIND'
                          ? 'blue'
                          : 'cyan'
                      }
                    >
                      {cert.energyType}
                    </Badge>
                  </Td>
                  <Td>{cert.mwhQuantity}</Td>
                  <Td>{new Date(cert.generationDate).toLocaleDateString()}</Td>
                  <Td>{cert.carbonOffset.toFixed(2)} tons</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => openTransferModal(cert)}
                    >
                      Transfer
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Grid>

      {/* Transfer Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer Certificate</ModalHeader>
          <ModalBody>
            <FormControl>
              <FormLabel>New Owner ID</FormLabel>
              <Input
                value={transferForm.newOwnerId}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, newOwnerId: e.target.value })
                }
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleTransfer}>
              Transfer
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RECMarket;
