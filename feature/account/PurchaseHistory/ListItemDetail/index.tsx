"use client";

import {
  Box,
  Text,
  NumberFormatter,
  Table,
  Image,
  Modal,
  Button,
} from "@mantine/core";
import { useEffect, useState } from "react";
// Replace with your actual API call
import style from "./ListItemDetail.module.scss";
import { getOrderDetails } from "@/api/ApiPayment";
import { createQrCode } from "@/api/apiMBQR";
import { message } from "antd";
import { modals } from "@mantine/modals";
import QrForm from "./newPayment";

interface ListItemDetailProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}
const orderStatus: Record<number, string> = {
  0: "Đang xử lý",
  1: "Đang giao",
  2: "Đã hủy",
  3: "Đã giao",
  4: "Đã hủy",
};

const ListItemDetail: React.FC<ListItemDetailProps> = ({
  orderId,
  isOpen,
  onClose,
}) => {
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [valueQrCode, setValueQrCode] = useState("");
  const [isRender, setIsRender] = useState(true);
  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await getOrderDetails(orderId);
      if (response.success) {
        setOrderDetail(response.data);
      } else {
        console.error("Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  function openFormPayment(id: number, valueQrCode: any) {
    modals.openConfirmModal({
      size: "1000px",
      radius: "20px",
      centered: true,
      title: (
        <Text fw={700} lineClamp={2}>
          Thanh toán
        </Text>
      ),
      children: (
        <QrForm
          isOpen={true}
          onClose={() => modals.closeAll()}
          id={id}
          handleCreateQrCode={handleCreateQrCode}
          valueQr={valueQrCode}
          showLoading={isRender}
          fetchOrderDetail={() => fetchOrderDetail()}
        />
      ),
      confirmProps: { display: "none" },
      cancelProps: { display: "none" },
      zIndex: 1000,
      classNames: {
        header: style.header,
        content: style.content,
      },
    });
  }

  const handleCreateQrCode = async () => {
    try {
      const response = await createQrCode({
        amount: orderDetail?.total,
        accountNo: 4505116887,
        accountName: "BUI THE ANH",
        acqId: 970418,
        format: "text",
        template: "wkN8cwa",
      });
      if (response?.code === "00") {
        setValueQrCode(response.data.qrDataURL);
        // Lưu URL mã QR base64
        openFormPayment(orderDetail.id, response.data.qrDataURL);
      } else {
        // Xử lý lỗi từ API
        message.error(response?.data?.desc || "lấy QR code thất bại.");
        setValueQrCode("");
      }
    } catch (error) {
      // Xử lý lỗi yêu cầu
      console.error("API request failed:", error);
      message.error("lấy QR code thất bại vui lòng liên hệ với bên quản lý.");
      setValueQrCode("");
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId]);

  return (
    <Modal opened={isOpen} onClose={onClose} size="1000px">
      {loading ? (
        <Text>Đang tải...</Text>
      ) : orderDetail ? (
        <Box className={style.listItemDetail}>
          <Text fw={700} size="lg" mb="sm">
            Thông tin đơn hàng
          </Text>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Thông tin</Table.Th>
                <Table.Th>Chi tiết</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Họ và tên</Table.Td>
                <Table.Td>{orderDetail.name}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Số điện thoại</Table.Td>
                <Table.Td>{orderDetail.phone}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Địa chỉ</Table.Td>
                <Table.Td>{orderDetail.address}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Trạng thái</Table.Td>
                <Table.Td>
                  <Table.Td>
                    {orderStatus[orderDetail.delivered] || "Không xác định"}
                  </Table.Td>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Tổng tiền</Table.Td>
                <Table.Td>
                  <NumberFormatter
                    value={orderDetail.total}
                    thousandSeparator="."
                    decimalSeparator=","
                    suffix="₫"
                  />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Ghi chú</Table.Td>
                <Table.Td>{orderDetail.note || "Không có"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Ngày đặt hàng</Table.Td>
                <Table.Td>
                  {new Date(orderDetail.order_date).toLocaleDateString()}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Phương thức thanh toán</Table.Td>
                <Table.Td>
                  {orderDetail.method === 1 ? "Online" : "COD"}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Trạng thái thanh toán</Table.Td>
                <Table.Td>
                  {orderDetail.payment === 0
                    ? "Chưa thanh toán"
                    : orderDetail.payment === 1
                    ? "Đã thanh toán"
                    : orderDetail.payment === 2
                    ? "Thanh toán thất bại"
                    : orderDetail.payment === 3
                    ? "Đã hoàn tiền"
                    : "Không xác định, vui lòng liên hệ quản trị viên"}
                </Table.Td>
              </Table.Tr>
              {orderDetail.payment === 1 || orderDetail.payment === 2 ? (
                <></>
              ) : (
                <Table.Tr>
                  <Table.Td>Thanh toán ngay</Table.Td>
                  <Table.Td>
                    <Button onClick={handleCreateQrCode}>
                      thanh toán ngay
                    </Button>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Text fw={700} size="lg" mb="sm">
            Chi tiết sản phẩm
          </Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Hình ảnh</Table.Th>
                <Table.Th>Tên sản phẩm</Table.Th>
                <Table.Th>Số lượng</Table.Th>
                <Table.Th>Giá</Table.Th>
                <Table.Th>Tổng</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orderDetail.orderDetails.map((item: any, index: number) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Image
                      src={`${
                        process.env.NEXT_PUBLIC_URL || "http://localhost:3001"
                      }/${item.image}`}
                      alt={item.product_name}
                      className={style.image}
                      radius="md"
                    />
                  </Table.Td>
                  <Table.Td>{item.product_name}</Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>
                    <NumberFormatter
                      value={item.price}
                      thousandSeparator="."
                      decimalSeparator=","
                      suffix="₫"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter
                      value={item.quantity * item.price}
                      thousandSeparator="."
                      decimalSeparator=","
                      suffix="₫"
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      ) : (
        <Text>Không có thông tin đơn hàng.</Text>
      )}
    </Modal>
  );
};

export default ListItemDetail;
